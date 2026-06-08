"use server";

import { revalidatePath } from "next/cache";
import type { StatusMensagem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { mensagemSchema, respostaSchema, type MensagemInput, type RespostaInput } from "@/lib/validations/mensagem";

type Result = { erro?: string };

/**
 * Resolve o destinatário institucional de uma mensagem do aluno: coordenador
 * da turma da matrícula mais recente → coordenador do curso → primeiro
 * Admin/Gestor ativo. A caixa do painel é compartilhada por quem tem
 * `mensagens.responder`, então o destinatário serve de encaminhamento inicial.
 */
async function resolverDestinatario(idUsuarioAluno: string): Promise<string | null> {
  const aluno = await prisma.aluno.findUnique({
    where: { idUsuario: idUsuarioAluno },
    select: { id: true },
  });
  if (aluno) {
    const mat = await prisma.matricula.findFirst({
      where: { idAluno: aluno.id },
      orderBy: { dataMatricula: "desc" },
      select: {
        turma: { select: { idCoordenador: true } },
        curso: { select: { idCoordenador: true } },
      },
    });
    const coord = mat?.turma?.idCoordenador ?? mat?.curso?.idCoordenador;
    if (coord) return coord;
  }
  const staff = await prisma.usuario.findFirst({
    where: { situacao: "Ativo", vinculo: { in: ["Admin", "Gestor"] } },
    orderBy: { criadoEm: "asc" },
    select: { id: true },
  });
  return staff?.id ?? null;
}

/** Aluno abre uma mensagem/dúvida/solicitação para a instituição. */
export async function enviarMensagem(input: MensagemInput): Promise<Result> {
  const user = await requirePermission("mensagens.enviar");
  const parsed = mensagemSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const destino = await resolverDestinatario(user.id);
  if (!destino) return { erro: "Não há destinatário disponível para atendimento no momento." };

  const msg = await prisma.mensagemSolicitacao.create({
    data: {
      idRemetente: user.id,
      idDestinatario: destino,
      tipo: parsed.data.tipo,
      assunto: parsed.data.assunto?.trim() || null,
      conteudo: parsed.data.conteudo,
      idDisciplina: parsed.data.idDisciplina ?? null,
      status: "Aberta",
    },
  });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MENSAGEM_ENVIADA",
    modulo: "Mensagens",
    resultado: `${parsed.data.tipo} — ${msg.id}`,
  });

  revalidatePath("/aluno/mensagens");
  revalidatePath("/painel/mensagens");
  return {};
}

/** Equipe responde uma mensagem (marca como Respondida). */
export async function responderMensagem(id: string, input: RespostaInput): Promise<Result> {
  const user = await requirePermission("mensagens.responder");
  const parsed = respostaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Escreva a resposta." };

  const existente = await prisma.mensagemSolicitacao.findUnique({ where: { id }, select: { id: true } });
  if (!existente) return { erro: "Mensagem não encontrada." };

  await prisma.mensagemSolicitacao.update({
    where: { id },
    data: { resposta: parsed.data.resposta, status: "Respondida" },
  });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MENSAGEM_RESPONDIDA",
    modulo: "Mensagens",
    resultado: id,
  });

  revalidatePath("/painel/mensagens");
  revalidatePath("/aluno/mensagens");
  return {};
}

/** Atualiza o status de uma mensagem (Em andamento / Encerrada). */
export async function atualizarStatusMensagem(id: string, status: StatusMensagem): Promise<Result> {
  const user = await requirePermission("mensagens.responder");
  const validos: StatusMensagem[] = ["Aberta", "EmAndamento", "Respondida", "Encerrada"];
  if (!validos.includes(status)) return { erro: "Status inválido." };

  const existente = await prisma.mensagemSolicitacao.findUnique({ where: { id }, select: { id: true } });
  if (!existente) return { erro: "Mensagem não encontrada." };

  await prisma.mensagemSolicitacao.update({ where: { id }, data: { status } });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MENSAGEM_STATUS",
    modulo: "Mensagens",
    resultado: `${id} → ${status}`,
  });

  revalidatePath("/painel/mensagens");
  revalidatePath("/aluno/mensagens");
  return {};
}
