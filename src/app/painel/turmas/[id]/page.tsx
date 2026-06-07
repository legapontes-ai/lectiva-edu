import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { TurmaForm } from "@/components/turmas/turma-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar turma" };

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("turmas.gerenciar");
  const { id } = await params;
  const turma = await prisma.turma.findUnique({ where: { id } });
  if (!turma) notFound();

  const [cursos, coordenadores] = await Promise.all([
    prisma.curso.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.usuario.findMany({
      where: { vinculo: { in: ["Coordenacao", "Admin"] }, situacao: "Ativo" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const valores = {
    id: turma.id,
    nome: turma.nome,
    idCurso: turma.idCurso,
    anoPeriodo: turma.anoPeriodo,
    situacao: turma.situacao,
    dataInicio: iso(turma.dataInicio),
    dataTermino: iso(turma.dataTermino),
    idCoordenador: turma.idCoordenador ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar turma" descricao={turma.nome} />
      <Card>
        <CardContent className="pt-6">
          <TurmaForm turma={valores} cursos={cursos} coordenadores={coordenadores} />
        </CardContent>
      </Card>
    </div>
  );
}
