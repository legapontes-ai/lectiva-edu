"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { professorSchema, type ProfessorInput } from "@/lib/validations/professor";

type Result = { erro?: string };

function toData(d: ProfessorInput) {
  return {
    nome: d.nome,
    situacao: d.situacao,
    email: d.email ?? null,
    cpf: d.cpf ?? null,
    telefone: d.telefone ?? null,
    titulacao: d.titulacao ?? null,
    areaAtuacao: d.areaAtuacao ?? null,
    lattes: d.lattes ?? null,
    miniCurriculo: d.miniCurriculo ?? null,
  };
}

function tratarErro(e: unknown): Result {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { erro: "Já existe um docente com este CPF." };
  }
  return { erro: "Não foi possível concluir a operação." };
}

export async function criarProfessor(input: ProfessorInput): Promise<Result> {
  const user = await requirePermission("professores.gerenciar");
  const parsed = professorSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  try {
    const p = await prisma.professor.create({ data: toData(parsed.data) });
    await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "DOCENTE_CRIADO", modulo: "Docentes", resultado: p.nome });
  } catch (e) {
    return tratarErro(e);
  }
  revalidatePath("/painel/professores");
  redirect("/painel/professores");
}

export async function atualizarProfessor(id: string, input: ProfessorInput): Promise<Result> {
  const user = await requirePermission("professores.gerenciar");
  const parsed = professorSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  try {
    await prisma.professor.update({ where: { id }, data: toData(parsed.data) });
    await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "DOCENTE_ATUALIZADO", modulo: "Docentes", resultado: parsed.data.nome });
  } catch (e) {
    return tratarErro(e);
  }
  revalidatePath("/painel/professores");
  redirect("/painel/professores");
}

export async function excluirProfessor(id: string): Promise<Result> {
  const user = await requirePermission("professores.gerenciar");
  try {
    const p = await prisma.professor.delete({ where: { id } });
    await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "DOCENTE_EXCLUIDO", modulo: "Docentes", resultado: p.nome });
  } catch {
    return { erro: "Não foi possível excluir (há disciplinas vinculadas ao docente)." };
  }
  revalidatePath("/painel/professores");
  return {};
}
