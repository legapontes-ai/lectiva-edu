import { cn } from "@/lib/utils";

/**
 * Barra de evolução (percentual ministrado). Componente puramente visual —
 * recebe o percentual já calculado (0–100) pelo servidor.
 */
export function BarraEvolucao({
  percentual,
  className,
}: {
  percentual: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)));
  return (
    <div className={cn("space-y-1", className)}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Evolução: ${pct}% ministrado`}
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
