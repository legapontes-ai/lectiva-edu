import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { ModeloCertificadoForm } from "@/components/certificados/modelo-certificado-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar modelo de certificado" };

export default async function EditarModeloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("certificados.gerenciar");
  const { id } = await params;
  const modelo = await prisma.modeloCertificado.findUnique({ where: { id } });
  if (!modelo) notFound();

  const valores = {
    id: modelo.id,
    nome: modelo.nome,
    tipo: modelo.tipo,
    situacao: modelo.situacao,
    layout: modelo.layout ?? "",
    textoPadrao: modelo.textoPadrao ?? "",
    requisitos: modelo.requisitos ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar modelo" descricao={modelo.nome} />
      <Card>
        <CardContent className="pt-6">
          <ModeloCertificadoForm modelo={valores} />
        </CardContent>
      </Card>
    </div>
  );
}
