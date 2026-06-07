import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { CursoForm } from "@/components/cursos/curso-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar curso" };

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("cursos.gerenciar");
  const { id } = await params;
  const curso = await prisma.curso.findUnique({ where: { id } });
  if (!curso) notFound();

  const coordenadores = await prisma.usuario.findMany({
    where: { vinculo: { in: ["Coordenacao", "Admin"] }, situacao: "Ativo" },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const valores = {
    id: curso.id,
    nome: curso.nome,
    tipo: curso.tipo,
    modalidade: curso.modalidade,
    situacao: curso.situacao,
    cargaHoraria: curso.cargaHoraria,
    duracaoMeses: curso.duracaoMeses ?? undefined,
    valorInvestimento: curso.valorInvestimento ? Number(curso.valorInvestimento) : undefined,
    areaConhecimento: curso.areaConhecimento ?? "",
    formaPagamento: curso.formaPagamento ?? "",
    objetivos: curso.objetivos ?? "",
    metodologia: curso.metodologia ?? "",
    requisitosConclusao: curso.requisitosConclusao ?? "",
    idCoordenador: curso.idCoordenador ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar curso" descricao={curso.nome} />
      <Card>
        <CardContent className="pt-6">
          <CursoForm curso={valores} coordenadores={coordenadores} />
        </CardContent>
      </Card>
    </div>
  );
}
