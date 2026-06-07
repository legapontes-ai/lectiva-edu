import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { ComunicadoForm } from "@/components/comunicados/comunicado-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo comunicado" };

export default async function NovoComunicadoPage() {
  await requirePermission("comunicados.gerenciar");

  const turmasRaw = await prisma.turma.findMany({
    orderBy: [{ anoPeriodo: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, anoPeriodo: true },
  });
  const turmas = turmasRaw.map((t) => ({ id: t.id, nome: `${t.nome} — ${t.anoPeriodo}` }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo comunicado" descricao="Publique um aviso para turmas ou equipes." />
      <Card>
        <CardContent className="pt-6">
          <ComunicadoForm turmas={turmas} />
        </CardContent>
      </Card>
    </div>
  );
}
