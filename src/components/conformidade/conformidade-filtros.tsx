"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "Pendente", label: "Pendentes" },
  { value: "Conforme", label: "Conformes" },
  { value: "NaoConforme", label: "Não conformes" },
] as const;

/** Filtros por status de conformidade (atualizam a query string). */
export function ConformidadeFiltros({ atual }: { atual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selecionar(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div
      role="group"
      aria-label="Filtrar por status de conformidade"
      className="flex flex-wrap gap-2"
    >
      {FILTROS.map((f) => {
        const ativo = atual === f.value;
        return (
          <button
            key={f.value || "todos"}
            type="button"
            aria-pressed={ativo}
            onClick={() => selecionar(f.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              ativo
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
