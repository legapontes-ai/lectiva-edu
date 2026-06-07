"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { analiseSchema, type AnaliseInput } from "@/lib/validations/conformidade";

type Result = { erro?: string; ok?: boolean };

/**
 * Registra (ou atualiza) a análise de conformidade de um plano de aula.
 * Faz upsert por idPlano e grava analista + data da análise.
 */
export async function registrarAnalise(input: AnaliseInput): Promise<Result> {
  const user = await requirePermission("planos.conformidade");
  const parsed = analiseSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const { idPlano, status, observacoes } = parsed.data;

  const plano = await prisma.planoAula.findUnique({ where: { id: idPlano } });
  if (!plano) return { erro: "Plano de aula não encontrado." };

  await prisma.analiseConformidade.upsert({
    where: { idPlano },
    create: {
      idPlano,
      status,
      observacoes: observacoes ?? null,
      analisadoPor: user.id,
      dataAnalise: new Date(),
    },
    update: {
      status,
      observacoes: observacoes ?? null,
      analisadoPor: user.id,
      dataAnalise: new Date(),
    },
  });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CONFORMIDADE_ANALISADA",
    modulo: "Conformidade",
    resultado: status,
  });

  revalidatePath("/painel/conformidade");
  revalidatePath(`/painel/conformidade/${idPlano}`);
  return { ok: true };
}
