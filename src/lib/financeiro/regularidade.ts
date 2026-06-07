import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Regularidade financeira do aluno: retorna true se o aluno NÃO possui nenhuma
 * Parcela na situação "Vencida". Usado por relatórios e pré-requisitos.
 * (O módulo de certificados faz sua própria checagem de elegibilidade.)
 */
export async function alunoRegular(idAluno: string): Promise<boolean> {
  const vencidas = await prisma.parcela.count({
    where: { situacao: "Vencida", plano: { idAluno } },
  });
  return vencidas === 0;
}
