"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { cursoSchema, type CursoInput } from "@/lib/validations/curso";

type Result = { erro?: string };

function toData(d: CursoInput) {
  return {
    nome: d.nome,
    tipo: d.tipo,
    modalidade: d.modalidade,
    situacao: d.situacao,
    cargaHoraria: d.cargaHoraria,
    duracaoMeses: d.duracaoMeses ?? null,
    valorInvestimento: d.valorInvestimento ?? null,
    areaConhecimento: d.areaConhecimento ?? null,
    formaPagamento: d.formaPagamento ?? null,
    objetivos: d.objetivos ?? null,
    metodologia: d.metodologia ?? null,
    requisitosConclusao: d.requisitosConclusao ?? null,
    idCoordenador: d.idCoordenador ?? null,
    notaMinimaAprovacao: d.notaMinimaAprovacao,
    frequenciaMinima: d.frequenciaMinima,
    origemNota: d.origemNota,
    exigeTodasDisciplinas: d.exigeTodasDisciplinas,
  };
}

export async function criarCurso(input: CursoInput): Promise<Result> {
  const user = await requirePermission("cursos.gerenciar");
  const parsed = cursoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const curso = await prisma.curso.create({ data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CURSO_CRIADO",
    modulo: "Cursos",
    resultado: curso.nome,
  });
  revalidatePath("/painel/cursos");
  redirect("/painel/cursos");
}

export async function atualizarCurso(id: string, input: CursoInput): Promise<Result> {
  const user = await requirePermission("cursos.gerenciar");
  const parsed = cursoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.curso.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CURSO_ATUALIZADO",
    modulo: "Cursos",
    resultado: parsed.data.nome,
  });
  revalidatePath("/painel/cursos");
  redirect("/painel/cursos");
}

export async function excluirCurso(id: string): Promise<Result> {
  const user = await requirePermission("cursos.gerenciar");
  try {
    const curso = await prisma.curso.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "CURSO_EXCLUIDO",
      modulo: "Cursos",
      resultado: curso.nome,
    });
  } catch {
    return { erro: "Não foi possível excluir (há turmas, matrículas ou planos vinculados)." };
  }
  revalidatePath("/painel/cursos");
  return {};
}
