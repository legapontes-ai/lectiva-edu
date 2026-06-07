import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { CalendarioMes } from "@/components/calendario/calendario-mes";
import { ListaMes } from "@/components/calendario/lista-mes";
import { NOMES_MESES, TZ_CALENDARIO, type EventoView } from "@/lib/calendario/view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export const metadata: Metadata = { title: "Calendário acadêmico" };

type SP = {
  view?: string;
  ano?: string;
  mes?: string;
  idTurma?: string;
  idDisciplina?: string;
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requirePermission("calendario.gerenciar");
  const podeGerenciar = await temPermissao("calendario.gerenciar");
  const sp = await searchParams;

  const hojeSP = formatInTimeZone(new Date(), TZ_CALENDARIO, "yyyy-MM");
  const [anoAtual, mesAtual] = hojeSP.split("-").map(Number);

  const view = sp.view === "lista" ? "lista" : "mes";
  const ano = Number(sp.ano) || anoAtual;
  const mes = Math.min(Math.max(Number(sp.mes) || mesAtual, 1), 12);
  const idTurma = sp.idTurma || "";
  const idDisciplina = sp.idDisciplina || "";

  const referencia = new Date(ano, mes - 1, 1);
  // Intervalo de busca: grade completa (com transbordo) na visão mês; apenas o mês na lista.
  const inicioData = view === "mes" ? startOfWeek(startOfMonth(referencia), { weekStartsOn: 0 }) : startOfMonth(referencia);
  const fimData = view === "mes" ? endOfWeek(endOfMonth(referencia), { weekStartsOn: 0 }) : endOfMonth(referencia);
  const inicioUtc = fromZonedTime(`${format(inicioData, "yyyy-MM-dd")}T00:00:00`, TZ_CALENDARIO);
  const fimUtc = fromZonedTime(`${format(fimData, "yyyy-MM-dd")}T23:59:59.999`, TZ_CALENDARIO);

  const [eventos, turmas, disciplinas] = await Promise.all([
    prisma.evento.findMany({
      where: {
        dataInicio: { gte: inicioUtc, lte: fimUtc },
        ...(idTurma ? { idTurma } : {}),
        ...(idDisciplina ? { idDisciplina } : {}),
      },
      orderBy: { dataInicio: "asc" },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        modalidade: true,
        dataInicio: true,
        dataFim: true,
        notificar: true,
        turma: { select: { nome: true } },
        disciplina: { select: { nome: true } },
      },
    }),
    prisma.turma.findMany({
      orderBy: [{ anoPeriodo: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true, anoPeriodo: true, curso: { select: { nome: true } } },
    }),
    prisma.disciplina.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const eventosView = eventos as EventoView[];

  const prev = mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
  const next = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };

  function href(o: { view?: string; ano?: number; mes?: number }) {
    const p = new URLSearchParams();
    p.set("view", o.view ?? view);
    p.set("ano", String(o.ano ?? ano));
    p.set("mes", String(o.mes ?? mes));
    if (idTurma) p.set("idTurma", idTurma);
    if (idDisciplina) p.set("idDisciplina", idDisciplina);
    return `/painel/calendario?${p.toString()}`;
  }

  const limparHref = `/painel/calendario?view=${view}&ano=${ano}&mes=${mes}`;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Calendário acadêmico"
        descricao="Aulas, avaliações, encontros e prazos da instituição."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/calendario/novo" />}>
              <Plus className="size-4" /> Novo evento
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" render={<Link href={href({ ...prev })} />} title="Mês anterior" aria-label="Mês anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center font-heading text-lg font-semibold text-primary">
            {NOMES_MESES[mes - 1]} de {ano}
          </span>
          <Button variant="outline" size="icon-sm" render={<Link href={href({ ...next })} />} title="Próximo mês" aria-label="Próximo mês">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" render={<Link href={href({ ano: anoAtual, mes: mesAtual })} />}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant={view === "mes" ? "secondary" : "ghost"} size="sm" render={<Link href={href({ view: "mes" })} />}>
            <CalendarDays className="size-4" /> Mês
          </Button>
          <Button variant={view === "lista" ? "secondary" : "ghost"} size="sm" render={<Link href={href({ view: "lista" })} />}>
            <List className="size-4" /> Lista
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="ano" value={ano} />
          <input type="hidden" name="mes" value={mes} />
          <div className="space-y-1.5">
            <label htmlFor="f-turma" className="text-xs font-medium text-muted-foreground">Turma</label>
            <Select id="f-turma" name="idTurma" defaultValue={idTurma} className="min-w-52">
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.curso.nome} — {t.nome} ({t.anoPeriodo})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="f-disc" className="text-xs font-medium text-muted-foreground">Disciplina</label>
            <Select id="f-disc" name="idDisciplina" defaultValue={idDisciplina} className="min-w-52">
              <option value="">Todas as disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline" size="default">Filtrar</Button>
          {(idTurma || idDisciplina) && (
            <Button variant="ghost" size="default" render={<Link href={limparHref} />}>Limpar</Button>
          )}
        </form>
      </Card>

      {view === "mes" ? (
        <CalendarioMes ano={ano} mes={mes} eventos={eventosView} />
      ) : (
        <ListaMes eventos={eventosView} podeGerenciar={podeGerenciar} />
      )}
    </div>
  );
}
