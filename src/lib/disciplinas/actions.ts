"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { disciplinaSchema, type DisciplinaInput } from "@/lib/validations/disciplina";

type Result = { erro?: string };

function toData(d: DisciplinaInput) {
  return {
    nome: d.nome,
    codigo: d.codigo ?? null,
    ementa: d.ementa ?? null,
    objetivos: d.objetivos ?? null,
    conteudoProgramatico: d.conteudoProgramatico ?? null,
    cargaHoraria: d.cargaHoraria,
    idProfessor: d.idProfessor ?? null,
    idModulo: d.idModulo ?? null,
    atividadesAvaliativas: d.atividadesAvaliativas ?? null,
    datasImportantes: d.datasImportantes ?? null,
    status: d.status,
  };
}

export async function criarDisciplina(input: DisciplinaInput): Promise<Result> {
  const user = await requirePermission("disciplinas.gerenciar");
  const parsed = disciplinaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const disciplina = await prisma.disciplina.create({ data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "DISCIPLINA_CRIADA",
    modulo: "Disciplinas",
    resultado: disciplina.nome,
  });
  revalidatePath("/painel/disciplinas");
  redirect("/painel/disciplinas");
}

export async function atualizarDisciplina(id: string, input: DisciplinaInput): Promise<Result> {
  const user = await requirePermission("disciplinas.gerenciar");
  const parsed = disciplinaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.disciplina.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "DISCIPLINA_ATUALIZADA",
    modulo: "Disciplinas",
    resultado: parsed.data.nome,
  });
  revalidatePath("/painel/disciplinas");
  redirect("/painel/disciplinas");
}

export async function excluirDisciplina(id: string): Promise<Result> {
  const user = await requirePermission("disciplinas.gerenciar");
  try {
    const disciplina = await prisma.disciplina.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "DISCIPLINA_EXCLUIDA",
      modulo: "Disciplinas",
      resultado: disciplina.nome,
    });
  } catch {
    return { erro: "Não foi possível excluir (há materiais, frequências, avaliações ou grades vinculadas)." };
  }
  revalidatePath("/painel/disciplinas");
  return {};
}
