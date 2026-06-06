import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <EmBreve
      titulo="Acesso à plataforma"
      descricao="O login com e-mail e senha (Supabase Auth), recuperação de senha e o controle de perfis chegam na Fase 1 — Núcleo."
    />
  );
}
