import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Cursos" };

export default function CursosPage() {
  return (
    <EmBreve
      titulo="Catálogo de cursos"
      descricao="O catálogo público (MBA, lato sensu, capacitação, extensão e cursos livres) com detalhes e certificação chega na Fase 2 — Ingresso."
    />
  );
}
