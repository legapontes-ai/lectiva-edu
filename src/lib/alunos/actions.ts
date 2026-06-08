"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { PERFIS } from "@/lib/auth/permissions";
import { criarAlunoSchema, editarAlunoSchema, type CriarAlunoInput, type EditarAlunoInput } from "@/lib/validations/aluno";
import { criarAuthUsuario, removerAuthUsuario } from "@/lib/usuarios/service";

type Result = { erro?: string };

function dadosAluno(d: EditarAlunoInput) {
  return {
    nome: d.nome,
    cpf: d.cpf ?? null,
    rg: d.rg ?? null,
    dataNascimento: d.dataNascimento ? new Date(d.dataNascimento) : null,
    telefone: d.telefone ?? null,
    endereco: d.endereco ?? null,
    situacaoAcademica: d.situacaoAcademica,
  };
}

export async function criarAluno(input: CriarAlunoInput): Promise<Result> {
  const ator = await requirePermission("alunos.gerenciar");
  const parsed = criarAlunoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const perfilAluno = await prisma.perfil.findUnique({ where: { nome: PERFIS.ALUNO } });
  if (!perfilAluno) return { erro: "Perfil 'Aluno' não encontrado. Rode o seed." };

  let authId: string;
  try {
    authId = await criarAuthUsuario(parsed.data.email, parsed.data.senha, parsed.data.nome);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao criar acesso do aluno." };
  }

  try {
    await prisma.$transaction([
      prisma.usuario.create({
        data: {
          id: authId,
          nome: parsed.data.nome,
          email: parsed.data.email,
          login: parsed.data.email,
          idPerfil: perfilAluno.id,
          vinculo: "Aluno",
          situacao: "Ativo",
        },
      }),
      prisma.aluno.create({
        data: { idUsuario: authId, email: parsed.data.email, ...dadosAluno(parsed.data) },
      }),
    ]);
  } catch {
    await removerAuthUsuario(authId); // rollback
    return { erro: "Não foi possível cadastrar o aluno (e-mail ou CPF já em uso)." };
  }

  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "ALUNO_CRIADO", modulo: "Alunos", resultado: parsed.data.email });
  revalidatePath("/painel/alunos");
  redirect("/painel/alunos");
}

export async function atualizarAluno(id: string, input: EditarAlunoInput): Promise<Result> {
  const ator = await requirePermission("alunos.gerenciar");
  const parsed = editarAlunoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const aluno = await prisma.aluno.findUnique({ where: { id } });
  if (!aluno) return { erro: "Aluno não encontrado." };

  await prisma.$transaction([
    prisma.aluno.update({ where: { id }, data: dadosAluno(parsed.data) }),
    prisma.usuario.update({ where: { id: aluno.idUsuario }, data: { nome: parsed.data.nome } }),
  ]);
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "ALUNO_ATUALIZADO", modulo: "Alunos", resultado: parsed.data.nome });
  revalidatePath("/painel/alunos");
  redirect("/painel/alunos");
}

export async function excluirAluno(id: string): Promise<Result> {
  const ator = await requirePermission("alunos.gerenciar");
  const aluno = await prisma.aluno.findUnique({
    where: { id },
    select: { id: true, idUsuario: true, nome: true },
  });
  if (!aluno) return { erro: "Aluno não encontrado." };
  // Soft-delete: inativa aluno + usuário (preserva matrículas, notas, frequência
  // e financeiro). O acesso é bloqueado pelo gate de sessão.
  await prisma.$transaction([
    prisma.aluno.update({ where: { id }, data: { situacaoAcademica: "Inativo" } }),
    prisma.usuario.update({ where: { id: aluno.idUsuario }, data: { situacao: "Inativo" } }),
  ]);
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "ALUNO_INATIVADO", modulo: "Alunos", resultado: aluno.nome });
  revalidatePath("/painel/alunos");
  return {};
}
