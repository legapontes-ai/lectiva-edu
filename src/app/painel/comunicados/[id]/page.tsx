import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { ComunicadoForm } from "@/components/comunicados/comunicado-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar comunicado" };

export default async function EditarComunicadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("comunicados.gerenciar");
  const { id } = await params;

  const comunicado = await prisma.comunicado.findUnique({ where: { id } });
  if (!comunicado) notFound();

  const turmasRaw = await prisma.turma.findMany({
    orderBy: [{ anoPeriodo: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, anoPeriodo: true },
  });
  const turmas = turmasRaw.map((t) => ({ id: t.id, nome: `${t.nome} — ${t.anoPeriodo}` }));

  const valores = {
    id: comunicado.id,
    titulo: comunicado.titulo,
    conteudo: comunicado.conteudo,
    publicoAlvo: comunicado.publicoAlvo,
    idTurma: comunicado.idTurma ?? "",
    urgencia: comunicado.urgencia,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar comunicado" descricao={comunicado.titulo} />
      <Card>
        <CardContent className="pt-6">
          <ComunicadoForm comunicado={valores} turmas={turmas} />
        </CardContent>
      </Card>
    </div>
  );
}
