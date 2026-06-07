"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { adicionarDisciplinaSchema, type StatusGradeValue } from "@/lib/grade/schema";

type Result = { erro?: string };

const MODULO = "Grade Curricular";

/** Transições de status permitidas. */
const TRANSICOES: Record<StatusGradeValue, StatusGradeValue[]> = {
  EmElaboracao: ["Validada"],
  Validada: ["Publicada", "EmElaboracao"],
  Publicada: [],
};

function revalidar(idCurso: string) {
  revalidatePath("/painel/grade");
  revalidatePath(`/painel/grade/${idCurso}`);
}

/** Soma as cargas horárias das disciplinas da grade e grava em cargaHorariaTotal. */
async function recalcular(idGrade: string): Promise<number> {
  const itens = await prisma.gradeDisciplina.findMany({
    where: { idGrade },
    include: { disciplina: { select: { cargaHoraria: true } } },
  });
  const total = itens.reduce((soma, i) => soma + (i.disciplina.cargaHoraria ?? 0), 0);
  await prisma.gradeCurricular.update({
    where: { id: idGrade },
    data: { cargaHorariaTotal: total },
  });
  return total;
}

/** Cria uma nova versão de grade para o curso (incrementa a maior versão). */
export async function criarVersaoGrade(idCurso: string): Promise<Result> {
  const user = await requirePermission("grade.gerenciar");

  const curso = await prisma.curso.findUnique({
    where: { id: idCurso },
    select: { id: true, nome: true },
  });
  if (!curso) return { erro: "Curso não encontrado." };

  const ultima = await prisma.gradeCurricular.findFirst({
    where: { idCurso },
    orderBy: { versao: "desc" },
    select: { versao: true },
  });
  const versao = (ultima?.versao ?? 0) + 1;

  await prisma.gradeCurricular.create({ data: { idCurso, versao } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "GRADE_VERSAO_CRIADA",
    modulo: MODULO,
    resultado: `${curso.nome} — versão ${versao}`,
  });
  revalidar(idCurso);
  return {};
}

/** Adiciona uma disciplina à grade (com período e pré-requisito opcionais) e recalcula a CH. */
export async function adicionarDisciplinaGrade(
  idGrade: string,
  idDisciplina: string,
  periodo?: number | null,
  preRequisito?: string | null,
): Promise<Result> {
  const user = await requirePermission("grade.gerenciar");

  const parsed = adicionarDisciplinaSchema.safeParse({ idDisciplina, periodo, preRequisito });
  if (!parsed.success) return { erro: "Dados inválidos." };

  const grade = await prisma.gradeCurricular.findUnique({
    where: { id: idGrade },
    select: { id: true, idCurso: true, status: true, versao: true },
  });
  if (!grade) return { erro: "Grade não encontrada." };
  if (grade.status === "Publicada") return { erro: "Não é possível alterar uma grade publicada." };

  // A disciplina precisa pertencer a um módulo deste curso.
  const disc = await prisma.disciplina.findFirst({
    where: { id: parsed.data.idDisciplina, modulo: { idCurso: grade.idCurso } },
    select: { id: true, nome: true },
  });
  if (!disc) return { erro: "Disciplina inválida para este curso." };

  try {
    await prisma.gradeDisciplina.create({
      data: {
        idGrade,
        idDisciplina: parsed.data.idDisciplina,
        periodo: parsed.data.periodo ?? null,
        preRequisito: parsed.data.preRequisito ?? null,
      },
    });
  } catch {
    return { erro: "Esta disciplina já consta na grade." };
  }

  await recalcular(idGrade);
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "GRADE_DISCIPLINA_ADICIONADA",
    modulo: MODULO,
    resultado: `v${grade.versao} + ${disc.nome}`,
  });
  revalidar(grade.idCurso);
  return {};
}

/** Remove uma disciplina da grade e recalcula a CH. */
export async function removerDisciplinaGrade(idGrade: string, idDisciplina: string): Promise<Result> {
  const user = await requirePermission("grade.gerenciar");

  const grade = await prisma.gradeCurricular.findUnique({
    where: { id: idGrade },
    select: { id: true, idCurso: true, status: true, versao: true },
  });
  if (!grade) return { erro: "Grade não encontrada." };
  if (grade.status === "Publicada") return { erro: "Não é possível alterar uma grade publicada." };

  try {
    await prisma.gradeDisciplina.delete({
      where: { idGrade_idDisciplina: { idGrade, idDisciplina } },
    });
  } catch {
    return { erro: "Disciplina não encontrada na grade." };
  }

  await recalcular(idGrade);
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "GRADE_DISCIPLINA_REMOVIDA",
    modulo: MODULO,
    resultado: `v${grade.versao}`,
  });
  revalidar(grade.idCurso);
  return {};
}

/** Recalcula manualmente a carga horária total da grade. */
export async function recalcularCH(idGrade: string): Promise<Result & { total?: number }> {
  const user = await requirePermission("grade.gerenciar");

  const grade = await prisma.gradeCurricular.findUnique({
    where: { id: idGrade },
    select: { idCurso: true, versao: true },
  });
  if (!grade) return { erro: "Grade não encontrada." };

  const total = await recalcular(idGrade);
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "GRADE_CH_RECALCULADA",
    modulo: MODULO,
    resultado: `v${grade.versao} = ${total}h`,
  });
  revalidar(grade.idCurso);
  return { total };
}

/** Altera o status da grade respeitando o fluxo EmElaboracao → Validada → Publicada. */
export async function definirStatusGrade(idGrade: string, status: StatusGradeValue): Promise<Result> {
  const user = await requirePermission("grade.gerenciar");

  const grade = await prisma.gradeCurricular.findUnique({
    where: { id: idGrade },
    select: { idCurso: true, versao: true, status: true, dataValidacao: true, _count: { select: { disciplinas: true } } },
  });
  if (!grade) return { erro: "Grade não encontrada." };

  if (!TRANSICOES[grade.status as StatusGradeValue].includes(status)) {
    return { erro: "Transição de status inválida." };
  }
  if ((status === "Validada" || status === "Publicada") && grade._count.disciplinas === 0) {
    return { erro: "Adicione ao menos uma disciplina antes de validar ou publicar." };
  }

  await prisma.gradeCurricular.update({
    where: { id: idGrade },
    data: {
      status,
      // Define a data de validação ao validar (mantém a existente nas demais transições).
      dataValidacao: status === "Validada" ? grade.dataValidacao ?? new Date() : grade.dataValidacao,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "GRADE_STATUS_ALTERADO",
    modulo: MODULO,
    resultado: `v${grade.versao} → ${status}`,
  });
  revalidar(grade.idCurso);
  return {};
}
