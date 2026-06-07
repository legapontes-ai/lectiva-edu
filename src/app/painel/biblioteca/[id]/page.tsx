import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { MaterialForm } from "@/components/biblioteca/material-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar material" };

export default async function EditarMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("biblioteca.gerenciar");
  const { id } = await params;
  const material = await prisma.materialBiblioteca.findUnique({ where: { id } });
  if (!material) notFound();

  const disciplinas = await prisma.disciplina.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const valores = {
    id: material.id,
    titulo: material.titulo,
    tipo: material.tipo,
    autor: material.autor ?? "",
    categoria: material.categoria ?? "",
    idDisciplina: material.idDisciplina ?? "",
    arquivoUrl: material.arquivoUrl ?? "",
    bibliografia: material.bibliografia ?? undefined,
    nivelAcesso: material.nivelAcesso,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar material" descricao={material.titulo} />
      <Card>
        <CardContent className="pt-6">
          <MaterialForm material={valores} disciplinas={disciplinas} />
        </CardContent>
      </Card>
    </div>
  );
}
