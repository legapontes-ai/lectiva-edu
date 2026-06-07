import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RedefinirForm } from "@/components/auth/redefinir-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function RedefinirSenhaPage() {
  return (
    <AuthShell titulo="Redefinir senha" descricao="Escolha uma nova senha para sua conta.">
      <RedefinirForm />
    </AuthShell>
  );
}
