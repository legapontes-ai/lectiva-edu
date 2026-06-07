"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";

type Result = { erro?: string };

export async function revogarConsentimento(id: string): Promise<Result> {
  const ator = await requirePermission("lgpd.gerenciar");
  await prisma.consentimento.update({
    where: { id },
    data: { situacao: "Revogado", dataRevogacao: new Date() },
  });
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "CONSENTIMENTO_REVOGADO", modulo: "LGPD", resultado: id });
  revalidatePath("/painel/consentimentos");
  return {};
}

export async function reativarConsentimento(id: string): Promise<Result> {
  const ator = await requirePermission("lgpd.gerenciar");
  await prisma.consentimento.update({
    where: { id },
    data: { situacao: "Ativo", dataRevogacao: null },
  });
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "CONSENTIMENTO_REATIVADO", modulo: "LGPD", resultado: id });
  revalidatePath("/painel/consentimentos");
  return {};
}
