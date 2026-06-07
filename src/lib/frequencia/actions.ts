"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { frequenciaEmLoteSchema, type FrequenciaEmLoteInput } from "@/lib/validations/frequencia";

type Result = { erro?: string; ok?: boolean };

/**
 * Registra a frequência de uma turma/disciplina em uma data, em lote.
 * Substitui registros existentes (mesma disciplina+turma+data+aluno) e
 * recalcula o percentual acumulado de presença por aluno na disciplina.
 */
export async function registrarFrequenciaEmLote(input: FrequenciaEmLoteInput): Promise<Result> {
  const user = await requirePermission("frequencia.gerenciar");
  const parsed = frequenciaEmLoteSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const { idDisciplina, idTurma, dataAula, tipoEncontro, registros } = parsed.data;
  const data = new Date(dataAula);
  if (Number.isNaN(data.getTime())) return { erro: "Data inválida." };
  const alunoIds = registros.map((r) => r.idAluno);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.frequencia.deleteMany({
        where: { idDisciplina, idTurma, dataAula: data, idAluno: { in: alunoIds } },
      });
      await tx.frequencia.createMany({
        data: registros.map((r) => ({
          idAluno: r.idAluno,
          idDisciplina,
          idTurma,
          dataAula: data,
          tipoEncontro,
          situacao: r.situacao,
          justificativa: r.situacao === "Justificado" ? (r.justificativa ?? null) : null,
        })),
      });
      // Recalcula o percentual acumulado de presença por aluno na disciplina.
      for (const idAluno of alunoIds) {
        const todas = await tx.frequencia.findMany({
          where: { idAluno, idDisciplina },
          select: { situacao: true },
        });
        const total = todas.length;
        const presentes = todas.filter((f) => f.situacao === "Presente").length;
        const pct = total ? Math.round((presentes / total) * 10000) / 100 : 0;
        await tx.frequencia.updateMany({
          where: { idAluno, idDisciplina },
          data: { percentualAcumulado: pct },
        });
      }
    });
  } catch {
    return { erro: "Não foi possível salvar a frequência." };
  }

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "FREQUENCIA_REGISTRADA",
    modulo: "Frequência",
    resultado: `${registros.length} registro(s)`,
  });
  revalidatePath("/painel/frequencia");
  return { ok: true };
}
