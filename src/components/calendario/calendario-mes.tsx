import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { chaveDia, horaSP, variantePorTipo, type EventoView } from "@/lib/calendario/view";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Visão de calendário mensal em grid (server component). */
export function CalendarioMes({
  ano,
  mes,
  eventos,
}: {
  ano: number;
  mes: number;
  eventos: EventoView[];
}) {
  const referencia = new Date(ano, mes - 1, 1);
  const inicioGrid = startOfWeek(startOfMonth(referencia), { weekStartsOn: 0 });
  const fimGrid = endOfWeek(endOfMonth(referencia), { weekStartsOn: 0 });
  const dias = eachDayOfInterval({ start: inicioGrid, end: fimGrid });

  const porDia = new Map<string, EventoView[]>();
  for (const ev of eventos) {
    const k = chaveDia(ev.dataInicio);
    const lista = porDia.get(k);
    if (lista) lista.push(ev);
    else porDia.set(k, [ev]);
  }

  const hoje = chaveDia(new Date());

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="px-2 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const k = format(dia, "yyyy-MM-dd");
          const doMes = isSameMonth(dia, referencia);
          const eventosDia = porDia.get(k) ?? [];
          const ehHoje = k === hoje;
          return (
            <div
              key={k}
              className={cn(
                "min-h-24 border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !doMes && "bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                  doMes ? "text-foreground" : "text-muted-foreground",
                  ehHoje && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {format(dia, "d")}
              </div>
              <div className="space-y-1">
                {eventosDia.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/painel/calendario/${ev.id}`}
                    className="block"
                    title={`${horaSP(ev.dataInicio)} — ${ev.titulo}`}
                  >
                    <Badge variant={variantePorTipo(ev.tipo)} className="w-full justify-start truncate">
                      <span className="truncate">{horaSP(ev.dataInicio)} {ev.titulo}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
