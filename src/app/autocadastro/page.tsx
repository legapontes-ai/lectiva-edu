import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PERFIS_AUTOCADASTRO } from "@/lib/validations/autocadastro";
import { AuthShell } from "@/components/auth/auth-shell";
import { AutocadastroForm } from "@/components/autocadastro/autocadastro-form";

export const metadata: Metadata = { title: "Autocadastro" };

export default async function AutocadastroPage() {
  const perfis = await prisma.perfil.findMany({
    where: { nome: { in: [...PERFIS_AUTOCADASTRO] } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <AuthShell
      titulo="Criar acesso"
      descricao="Solicite seu cadastro. Uma senha temporária será gerada e o acesso liberado após aprovação."
    >
      <AutocadastroForm perfis={perfis} />
    </AuthShell>
  );
}
