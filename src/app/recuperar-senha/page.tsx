import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RecuperarForm } from "@/components/auth/recuperar-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      titulo="Recuperar senha"
      descricao="Informe seu e-mail para receber um link de redefinição."
    >
      <RecuperarForm />
    </AuthShell>
  );
}
