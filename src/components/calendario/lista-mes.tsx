import Link from "next/link";
import { Pencil, CalendarDays } from "lucide-react";
import { formatarDataHora } from "@/lib/format";
import { rotulo } from "@/lib/enums";
import { TIPO_EVENTO, MODALIDADE_EVENTO } from "@/lib/validations/evento";
import { excluirEvento } from "@/lib/calendario/actions";
import { variantePorTipo, type EventoView } from "@/lib/calendario/view";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** Visão de lista de eventos do mês (server component). */
export function ListaMes({
  eventos,
  podeGerenciar,
}: {
  eventos: EventoView[];
  podeGerenciar: boolean;
}) {
  if (eventos.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <CalendarDays className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum evento neste mês.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Início</th>
              <th className="px-4 py-3 font-semibold">Evento</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Modalidade</th>
              <th className="px-4 py-3 font-semibold">Turma</th>
              <th className="px-4 py-3 font-semibold">Disciplina</th>
              {podeGerenciar && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eventos.map((ev) => (
              <tr key={ev.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatarDataHora(ev.dataInicio)}
                  {ev.dataFim && (
                    <span className="block text-xs">até {formatarDataHora(ev.dataFim)}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{ev.titulo}</td>
                <td className="px-4 py-3">
                  <Badge variant={variantePorTipo(ev.tipo)}>{rotulo(TIPO_EVENTO, ev.tipo)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{rotulo(MODALIDADE_EVENTO, ev.modalidade)}</td>
                <td className="px-4 py-3 text-muted-foreground">{ev.turma?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{ev.disciplina?.nome ?? "—"}</td>
                {podeGerenciar && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/calendario/${ev.id}`} />} title="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton action={excluirEvento.bind(null, ev.id)} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
