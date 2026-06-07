import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string; redefinida?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthShell titulo="Acessar a plataforma" descricao="Entre com seu e-mail institucional e senha.">
      {sp.motivo === "inatividade" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          Sessão encerrada por inatividade. Entre novamente.
        </div>
      )}
      {sp.redefinida === "1" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Senha redefinida com sucesso. Faça login.
        </div>
      )}
      <LoginForm />
    </AuthShell>
  );
}
