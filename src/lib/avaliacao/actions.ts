"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import {
  lancarNotasSchema,
  type LancarNotasInput,
  type SituacaoAvaliacaoValue,
} from "@/lib/validations/avaliacao";

type Result = { erro?: string; ok?: boolean };

/** Deriva a situação a partir da nota (0-10) quando não informada. */
function derivarSituacao(nota: number | null): SituacaoAvaliacaoValue | null {
  if (nota === null) return null;
  if (nota >= 7) return "Aprovado";
  if (nota >= 5) return "Recuperacao";
  return "Reprovado";
}

/**
 * Lança notas de uma turma/disciplina em lote. Substitui as avaliações
 * existentes (mesma disciplina+turma+tipo+aluno). Quando a situação não é
 * informada, é derivada da nota; o percentual de frequência, quando ausente,
 * é puxado do acumulado de frequência do aluno na disciplina.
 */
export async function lancarNotasEmLote(input: LancarNotasInput): Promise<Result> {
  const user = await requirePermission("avaliacao.gerenciar");
  const parsed = lancarNotasSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const { idDisciplina, idTurma, tipo, formaColeta, dataAplicacao, registros } = parsed.data;
  const efetivos = registros.filter((r) => r.nota !== undefined || r.situacao !== undefined);
  const alunoIds = registros.map((r) => r.idAluno);
  const data = dataAplicacao ? new Date(dataAplicacao) : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.avaliacao.deleteMany({
        where: { idDisciplina, idTurma, tipo, idAluno: { in: alunoIds } },
      });
      if (efetivos.length > 0) {
        const freqs = await tx.frequencia.findMany({
          where: { idDisciplina, idAluno: { in: efetivos.map((r) => r.idAluno) } },
          select: { idAluno: true, percentualAcumulado: true },
          distinct: ["idAluno"],
        });
        const pctMap = new Map<string, number>();
        for (const f of freqs) {
          if (f.percentualAcumulado !== null) pctMap.set(f.idAluno, Number(f.percentualAcumulado));
        }
        await tx.avaliacao.createMany({
          data: efetivos.map((r) => {
            const nota = r.nota !== undefined ? Math.min(10, Math.max(0, r.nota)) : null;
            const situacao = r.situacao ?? derivarSituacao(nota);
            const pf = r.percentualFrequencia ?? pctMap.get(r.idAluno) ?? null;
            return {
              idAluno: r.idAluno,
              idDisciplina,
              idTurma,
              tipo,
              formaColeta,
              dataAplicacao: data,
              nota,
              situacao,
              percentualFrequencia: pf,
            };
          }),
        });
      }
    });
  } catch {
    return { erro: "Não foi possível lançar as notas." };
  }

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "NOTAS_LANCADAS",
    modulo: "Avaliação",
    resultado: `${efetivos.length} nota(s)`,
  });
  revalidatePath("/painel/avaliacao");
  return { ok: true };
}
