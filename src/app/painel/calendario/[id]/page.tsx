import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { EventoForm } from "@/components/calendario/evento-form";
import { TZ_CALENDARIO } from "@/lib/calendario/view";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar evento" };

/** Converte um Date UTC para o formato de <input type="datetime-local"> em SP. */
function paraInputLocal(d: Date | null): string {
  if (!d) return "";
  return formatInTimeZone(d, TZ_CALENDARIO, "yyyy-MM-dd'T'HH:mm");
}

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("calendario.gerenciar");
  const { id } = await params;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const [turmas, disciplinas] = await Promise.all([
    prisma.turma.findMany({
      orderBy: [{ anoPeriodo: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true, anoPeriodo: true, curso: { select: { nome: true } } },
    }),
    prisma.disciplina.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const turmasOpt = turmas.map((t) => ({
    id: t.id,
    label: `${t.curso.nome} — ${t.nome} (${t.anoPeriodo})`,
  }));

  const valores = {
    id: evento.id,
    titulo: evento.titulo,
    tipo: evento.tipo,
    modalidade: evento.modalidade,
    dataInicio: paraInputLocal(evento.dataInicio),
    dataFim: paraInputLocal(evento.dataFim),
    idTurma: evento.idTurma ?? "",
    idDisciplina: evento.idDisciplina ?? "",
    descricao: evento.descricao ?? "",
    notificar: evento.notificar,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar evento" descricao={evento.titulo} />
      <Card>
        <CardContent className="pt-6">
          <EventoForm evento={valores} turmas={turmasOpt} disciplinas={disciplinas} />
        </CardContent>
      </Card>
    </div>
  );
}
