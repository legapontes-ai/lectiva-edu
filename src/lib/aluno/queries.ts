import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

/**
 * Aluno da sessão. Garante o vínculo Aluno (o layout de /aluno já redireciona,
 * mas reforçamos aqui). Retorna o usuário e o registro de Aluno (pode ser null
 * se a conta ainda não tem ficha de aluno vinculada).
 */
export async function alunoDaSessao() {
  const user = await requireUser();
  if (user.vinculo !== "Aluno") redirect("/painel");
  const aluno = await prisma.aluno.findUnique({ where: { idUsuario: user.id } });
  return { user, aluno };
}
