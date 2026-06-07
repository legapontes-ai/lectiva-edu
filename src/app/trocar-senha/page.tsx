import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { AuthShell } from "@/components/auth/auth-shell";
import { TrocarSenhaForm } from "@/components/autocadastro/trocar-senha-form";

export const metadata: Metadata = { title: "Definir nova senha" };

export default async function TrocarSenhaPage() {
  const user = await requireUser();
  const destino = user.vinculo === "Aluno" ? "/aluno" : "/painel";

  return (
    <AuthShell
      titulo="Defina sua senha"
      descricao="Você está usando uma senha provisória. Crie uma senha definitiva para continuar."
    >
      <TrocarSenhaForm destino={destino} />
    </AuthShell>
  );
}
