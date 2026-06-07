"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { turmaSchema, type TurmaInput } from "@/lib/validations/turma";

type Result = { erro?: string };

function toData(d: TurmaInput) {
  return {
    nome: d.nome,
    idCurso: d.idCurso,
    anoPeriodo: d.anoPeriodo,
    situacao: d.situacao,
    dataInicio: d.dataInicio ? new Date(d.dataInicio) : null,
    dataTermino: d.dataTermino ? new Date(d.dataTermino) : null,
    idCoordenador: d.idCoordenador ?? null,
  };
}

export async function criarTurma(input: TurmaInput): Promise<Result> {
  const user = await requirePermission("turmas.gerenciar");
  const parsed = turmaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  const turma = await prisma.turma.create({ data: toData(parsed.data) });
  await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "TURMA_CRIADA", modulo: "Turmas", resultado: turma.nome });
  revalidatePath("/painel/turmas");
  redirect("/painel/turmas");
}

export async function atualizarTurma(id: string, input: TurmaInput): Promise<Result> {
  const user = await requirePermission("turmas.gerenciar");
  const parsed = turmaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  await prisma.turma.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "TURMA_ATUALIZADA", modulo: "Turmas", resultado: parsed.data.nome });
  revalidatePath("/painel/turmas");
  redirect("/painel/turmas");
}

export async function excluirTurma(id: string): Promise<Result> {
  const user = await requirePermission("turmas.gerenciar");
  try {
    const turma = await prisma.turma.delete({ where: { id } });
    await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "TURMA_EXCLUIDA", modulo: "Turmas", resultado: turma.nome });
  } catch {
    return { erro: "Não foi possível excluir (há matrículas ou registros vinculados)." };
  }
  revalidatePath("/painel/turmas");
  return {};
}
