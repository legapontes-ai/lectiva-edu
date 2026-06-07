import Link from "next/link";
import { cn } from "@/lib/utils";

const ABAS = [
  { key: "plano", label: "Plano" },
  { key: "aulas", label: "Aulas" },
  { key: "notas", label: "Notas" },
  { key: "diario", label: "Diário de classe" },
  { key: "ocorrencias", label: "Ocorrências" },
] as const;

/** Navegação por abas via querystring (?aba=). Server component. */
export function PlanoTabs({ id, aba }: { id: string; aba: string }) {
  return (
    <nav aria-label="Seções do plano" className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
        {ABAS.map((a) => {
          const ativo = a.key === aba;
          return (
            <li key={a.key}>
              <Link
                href={`/painel/planos/${id}?aba=${a.key}`}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "inline-flex items-center whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  ativo
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {a.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
