import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { EventoForm } from "@/components/calendario/evento-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo evento" };

export default async function NovoEventoPage() {
  await requirePermission("calendario.gerenciar");

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo evento" descricao="Adicione um evento ao calendário acadêmico." />
      <Card>
        <CardContent className="pt-6">
          <EventoForm turmas={turmasOpt} disciplinas={disciplinas} />
        </CardContent>
      </Card>
    </div>
  );
}
