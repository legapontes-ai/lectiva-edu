"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { VINCULO_POR_PERFIL } from "@/lib/auth/permissions";
import { criarUsuarioSchema, editarUsuarioSchema, type CriarUsuarioInput, type EditarUsuarioInput } from "@/lib/validations/usuario";
import { criarAuthUsuario, removerAuthUsuario } from "@/lib/usuarios/service";

type Result = { erro?: string };

async function vinculoDoPerfil(idPerfil: string): Promise<{ nome: string; vinculo: "Aluno" | "Professor" | "Coordenacao" | "Secretaria" | "Admin" } | null> {
  const perfil = await prisma.perfil.findUnique({ where: { id: idPerfil } });
  if (!perfil) return null;
  return { nome: perfil.nome, vinculo: VINCULO_POR_PERFIL[perfil.nome] ?? "Secretaria" };
}

export async function criarUsuario(input: CriarUsuarioInput): Promise<Result> {
  const ator = await requirePermission("usuarios.gerenciar");
  const parsed = criarUsuarioSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const perfil = await vinculoDoPerfil(parsed.data.idPerfil);
  if (!perfil) return { erro: "Perfil inválido." };

  let authId: string;
  try {
    authId = await criarAuthUsuario(parsed.data.email, parsed.data.senha, parsed.data.nome);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao criar usuário." };
  }

  try {
    await prisma.usuario.create({
      data: {
        id: authId,
        nome: parsed.data.nome,
        email: parsed.data.email,
        login: parsed.data.email,
        idPerfil: parsed.data.idPerfil,
        vinculo: perfil.vinculo,
        situacao: "Ativo",
      },
    });
  } catch {
    await removerAuthUsuario(authId); // rollback
    return { erro: "Já existe um usuário com este e-mail." };
  }

  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "USUARIO_CRIADO", modulo: "Seguranca", resultado: parsed.data.email });
  revalidatePath("/painel/usuarios");
  redirect("/painel/usuarios");
}

export async function atualizarUsuario(id: string, input: EditarUsuarioInput): Promise<Result> {
  const ator = await requirePermission("usuarios.gerenciar");
  const parsed = editarUsuarioSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const perfil = await vinculoDoPerfil(parsed.data.idPerfil);
  if (!perfil) return { erro: "Perfil inválido." };

  if (id === ator.id && parsed.data.situacao !== "Ativo") {
    return { erro: "Você não pode inativar ou bloquear a própria conta." };
  }

  await prisma.usuario.update({
    where: { id },
    data: { nome: parsed.data.nome, idPerfil: parsed.data.idPerfil, vinculo: perfil.vinculo, situacao: parsed.data.situacao },
  });
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "USUARIO_ATUALIZADO", modulo: "Seguranca", resultado: id });
  revalidatePath("/painel/usuarios");
  redirect("/painel/usuarios");
}

export async function alterarSituacaoUsuario(id: string, situacao: "Ativo" | "Inativo" | "Bloqueado"): Promise<Result> {
  const ator = await requirePermission("usuarios.gerenciar");
  if (id === ator.id && situacao !== "Ativo") {
    return { erro: "Você não pode bloquear/inativar a própria conta." };
  }
  await prisma.usuario.update({ where: { id }, data: { situacao } });
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: `USUARIO_${situacao.toUpperCase()}`, modulo: "Seguranca", resultado: id });
  revalidatePath("/painel/usuarios");
  return {};
}

export async function excluirUsuario(id: string): Promise<Result> {
  const ator = await requirePermission("usuarios.gerenciar");
  if (id === ator.id) return { erro: "Você não pode excluir a própria conta." };
  try {
    await prisma.usuario.delete({ where: { id } });
    await removerAuthUsuario(id);
    await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "USUARIO_EXCLUIDO", modulo: "Seguranca", resultado: id });
  } catch {
    return { erro: "Não foi possível excluir (há registros vinculados a este usuário)." };
  }
  revalidatePath("/painel/usuarios");
  return {};
}
