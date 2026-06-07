"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { getGateway } from "@/lib/pagamentos/gateway";
import { planoSchema, baixaSchema, type PlanoInput, type BaixaInput } from "./schema";

type Result = { erro?: string };

/** Constrói uma data (UTC, meia-noite) para o dia/mês indicados, com overflow de mês. */
function dataVencimento(base: Date, dia: number, mesesAFrente: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + mesesAFrente, dia));
}

/**
 * Divide um valor (em reais) em N parcelas, em centavos, ajustando o resto na
 * última parcela para que a soma feche exatamente com o total.
 */
function dividirParcelas(total: number, n: number): number[] {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / n);
  const resto = totalCents - baseCents * n;
  return Array.from({ length: n }, (_, i) =>
    (i === n - 1 ? baseCents + resto : baseCents) / 100,
  );
}

/**
 * Cria um PlanoPagamento para uma matrícula e gera as parcelas 1..n com
 * vencimentos mensais. saldoDevedor inicial = valorTotal - descontos.
 */
export async function criarPlanoDeMatricula(
  idMatricula: string,
  dados: Omit<PlanoInput, "idMatricula">,
): Promise<Result> {
  const user = await requirePermission("financeiro.gerenciar");
  const parsed = planoSchema.safeParse({ idMatricula, ...dados });
  if (!parsed.success) return { erro: "Dados inválidos." };
  const { valorTotal, numParcelas, descontos, diaVencimento } = parsed.data;

  if (descontos > valorTotal) return { erro: "Descontos não podem exceder o valor total." };

  const matricula = await prisma.matricula.findUnique({
    where: { id: idMatricula },
    select: { id: true, idAluno: true, idCurso: true },
  });
  if (!matricula) return { erro: "Matrícula não encontrada." };

  const existente = await prisma.planoPagamento.findFirst({
    where: { idMatricula },
    select: { id: true },
  });
  if (existente) return { erro: "Esta matrícula já possui um plano de pagamento." };

  const liquido = valorTotal - descontos;
  const valores = dividirParcelas(liquido, numParcelas);
  const hoje = new Date();
  const base = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), 1));

  const plano = await prisma.planoPagamento.create({
    data: {
      idMatricula,
      idAluno: matricula.idAluno,
      idCurso: matricula.idCurso,
      valorTotal,
      numParcelas,
      descontos,
      saldoDevedor: liquido,
      situacao: "Adimplente",
      parcelas: {
        create: valores.map((valor, i) => ({
          numero: i + 1,
          valor,
          // Primeira parcela vence no mês seguinte ao da criação.
          vencimento: dataVencimento(base, diaVencimento, i + 1),
          situacao: "EmAberto" as const,
        })),
      },
    },
  });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "PLANO_PAGAMENTO_CRIADO",
    modulo: "Financeiro",
    resultado: `${numParcelas}x — plano ${plano.id}`,
  });

  revalidatePath("/painel/financeiro");
  redirect(`/painel/financeiro/${plano.id}`);
}

/**
 * Abre uma cobrança no provedor de pagamento para a parcela e guarda o link
 * de pagamento no campo `comprovante` (e a forma como o canal externo).
 */
export async function gerarCobranca(idParcela: string): Promise<Result> {
  const user = await requirePermission("financeiro.gerenciar");

  const parcela = await prisma.parcela.findUnique({
    where: { id: idParcela },
    include: {
      plano: {
        select: { aluno: { select: { nome: true } }, curso: { select: { nome: true } } },
      },
    },
  });
  if (!parcela) return { erro: "Parcela não encontrada." };
  if (parcela.situacao === "Paga") return { erro: "Parcela já está paga." };

  try {
    const gateway = getGateway();
    const cobranca = await gateway.criarCobranca({
      valor: Number(parcela.valor),
      vencimento: parcela.vencimento,
      descricao: `Parcela ${parcela.numero} — ${parcela.plano.curso.nome} — ${parcela.plano.aluno.nome}`,
      idParcela: parcela.id,
    });

    await prisma.parcela.update({
      where: { id: idParcela },
      data: { comprovante: cobranca.linkPagamento },
    });

    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "COBRANCA_GERADA",
      modulo: "Financeiro",
      resultado: `Parcela ${parcela.numero} — ${cobranca.idExterno}`,
    });
  } catch {
    return { erro: "Não foi possível gerar a cobrança no provedor." };
  }

  revalidatePath(`/painel/financeiro/${parcela.idPlano}`);
  return {};
}

/**
 * Dá baixa em uma parcela: marca como Paga, registra dataPagamento/forma e
 * recalcula o saldo devedor e a situação do plano.
 */
export async function darBaixaParcela(idParcela: string, dados: BaixaInput): Promise<Result> {
  const user = await requirePermission("financeiro.gerenciar");
  const parsed = baixaSchema.safeParse(dados);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const parcela = await prisma.parcela.findUnique({
    where: { id: idParcela },
    select: { id: true, idPlano: true, numero: true, situacao: true },
  });
  if (!parcela) return { erro: "Parcela não encontrada." };
  if (parcela.situacao === "Paga") return { erro: "Parcela já está paga." };

  await prisma.parcela.update({
    where: { id: idParcela },
    data: {
      situacao: "Paga",
      dataPagamento: new Date(),
      formaPagamento: parsed.data.forma,
      ...(parsed.data.comprovante ? { comprovante: parsed.data.comprovante } : {}),
    },
  });

  await recalcularPlano(parcela.idPlano);

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "PARCELA_BAIXADA",
    modulo: "Financeiro",
    resultado: `Parcela ${parcela.numero} — ${parsed.data.forma}`,
  });

  revalidatePath(`/painel/financeiro/${parcela.idPlano}`);
  revalidatePath("/painel/financeiro");
  return {};
}

/**
 * Marca como Vencida toda parcela EmAberto cujo vencimento já passou e atualiza
 * a situação dos planos afetados para Inadimplente.
 */
export async function atualizarVencidas(): Promise<Result> {
  const user = await requirePermission("financeiro.gerenciar");
  const hoje = new Date();
  const hojeUtc = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  const vencidas = await prisma.parcela.findMany({
    where: { situacao: "EmAberto", vencimento: { lt: hojeUtc } },
    select: { id: true, idPlano: true },
  });

  if (vencidas.length === 0) {
    revalidatePath("/painel/financeiro");
    return {};
  }

  await prisma.parcela.updateMany({
    where: { id: { in: vencidas.map((v) => v.id) } },
    data: { situacao: "Vencida" },
  });

  const planosAfetados = [...new Set(vencidas.map((v) => v.idPlano))];
  await prisma.planoPagamento.updateMany({
    where: { id: { in: planosAfetados } },
    data: { situacao: "Inadimplente" },
  });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "PARCELAS_VENCIDAS_ATUALIZADAS",
    modulo: "Financeiro",
    resultado: `${vencidas.length} parcela(s) em ${planosAfetados.length} plano(s)`,
  });

  revalidatePath("/painel/financeiro");
  return {};
}

/** Recalcula saldoDevedor (soma das parcelas não pagas) e situação do plano. */
async function recalcularPlano(idPlano: string): Promise<void> {
  const parcelas = await prisma.parcela.findMany({
    where: { idPlano },
    select: { valor: true, situacao: true, vencimento: true },
  });
  const hoje = new Date();
  const hojeUtc = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  const saldo = parcelas
    .filter((p) => p.situacao !== "Paga")
    .reduce((acc, p) => acc + Number(p.valor), 0);

  const temVencida = parcelas.some(
    (p) =>
      p.situacao === "Vencida" ||
      (p.situacao === "EmAberto" && p.vencimento < hojeUtc),
  );

  await prisma.planoPagamento.update({
    where: { id: idPlano },
    data: {
      saldoDevedor: saldo,
      situacao: temVencida ? "Inadimplente" : "Adimplente",
    },
  });
}
