"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { comunicadoSchema, type ComunicadoInput } from "@/lib/validations/comunicado";

type Result = { erro?: string };

function toData(d: ComunicadoInput) {
  return {
    titulo: d.titulo,
    conteudo: d.conteudo,
    publicoAlvo: d.publicoAlvo,
    // idTurma só faz sentido quando o público-alvo é uma turma específica.
    idTurma: d.publicoAlvo === "Turma" ? (d.idTurma ?? null) : null,
    urgencia: d.urgencia,
  };
}

export async function criarComunicado(input: ComunicadoInput): Promise<Result> {
  const user = await requirePermission("comunicados.gerenciar");
  const parsed = comunicadoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const comunicado = await prisma.comunicado.create({
    data: { ...toData(parsed.data), idAutor: user.id },
  });

  // TODO: enviar notificação por e-mail aos destinatários usando RESEND_API_KEY
  // (integração de e-mail real fora do escopo desta fase).

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "COMUNICADO_CRIADO",
    modulo: "Comunicados",
    resultado: comunicado.titulo,
  });
  revalidatePath("/painel/comunicados");
  redirect("/painel/comunicados");
}

export async function atualizarComunicado(id: string, input: ComunicadoInput): Promise<Result> {
  const user = await requirePermission("comunicados.gerenciar");
  const parsed = comunicadoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.comunicado.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "COMUNICADO_ATUALIZADO",
    modulo: "Comunicados",
    resultado: parsed.data.titulo,
  });
  revalidatePath("/painel/comunicados");
  redirect("/painel/comunicados");
}

/** Alterna a situação entre Publicado e Arquivado. */
export async function alternarSituacaoComunicado(id: string): Promise<Result> {
  const user = await requirePermission("comunicados.gerenciar");
  const atual = await prisma.comunicado.findUnique({
    where: { id },
    select: { situacao: true, titulo: true },
  });
  if (!atual) return { erro: "Comunicado não encontrado." };

  const novaSituacao = atual.situacao === "Publicado" ? "Arquivado" : "Publicado";
  await prisma.comunicado.update({ where: { id }, data: { situacao: novaSituacao } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: novaSituacao === "Arquivado" ? "COMUNICADO_ARQUIVADO" : "COMUNICADO_PUBLICADO",
    modulo: "Comunicados",
    resultado: atual.titulo,
  });
  revalidatePath("/painel/comunicados");
  return {};
}

export async function excluirComunicado(id: string): Promise<Result> {
  const user = await requirePermission("comunicados.gerenciar");
  try {
    const comunicado = await prisma.comunicado.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "COMUNICADO_EXCLUIDO",
      modulo: "Comunicados",
      resultado: comunicado.titulo,
    });
  } catch {
    return { erro: "Não foi possível excluir o comunicado." };
  }
  revalidatePath("/painel/comunicados");
  return {};
}
