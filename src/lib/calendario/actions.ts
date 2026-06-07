"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { eventoSchema, type EventoInput } from "@/lib/validations/evento";

const TZ = "America/Sao_Paulo";

type Result = { erro?: string };

/** Converte um valor de <input type="datetime-local"> (hora local SP) para Date UTC. */
function paraUtc(valor: string): Date {
  return fromZonedTime(valor, TZ);
}

function toData(d: EventoInput) {
  return {
    titulo: d.titulo,
    tipo: d.tipo,
    modalidade: d.modalidade,
    dataInicio: paraUtc(d.dataInicio),
    dataFim: d.dataFim ? paraUtc(d.dataFim) : null,
    idTurma: d.idTurma ?? null,
    idDisciplina: d.idDisciplina ?? null,
    descricao: d.descricao ?? null,
    notificar: d.notificar,
  };
}

export async function criarEvento(input: EventoInput): Promise<Result> {
  const user = await requirePermission("calendario.gerenciar");
  const parsed = eventoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const evento = await prisma.evento.create({ data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "EVENTO_CRIADO",
    modulo: "Calendário",
    resultado: evento.titulo,
  });
  revalidatePath("/painel/calendario");
  redirect("/painel/calendario");
}

export async function atualizarEvento(id: string, input: EventoInput): Promise<Result> {
  const user = await requirePermission("calendario.gerenciar");
  const parsed = eventoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.evento.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "EVENTO_ATUALIZADO",
    modulo: "Calendário",
    resultado: parsed.data.titulo,
  });
  revalidatePath("/painel/calendario");
  redirect("/painel/calendario");
}

export async function excluirEvento(id: string): Promise<Result> {
  const user = await requirePermission("calendario.gerenciar");
  try {
    const evento = await prisma.evento.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "EVENTO_EXCLUIDO",
      modulo: "Calendário",
      resultado: evento.titulo,
    });
  } catch {
    return { erro: "Não foi possível excluir o evento." };
  }
  revalidatePath("/painel/calendario");
  return {};
}
