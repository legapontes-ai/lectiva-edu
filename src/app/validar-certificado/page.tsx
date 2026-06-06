import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Validar certificado" };

export default function ValidarCertificadoPage() {
  return (
    <EmBreve
      titulo="Validação de certificados"
      descricao="A verificação pública de autenticidade por código chega na Fase 4 — Certificação."
    />
  );
}
