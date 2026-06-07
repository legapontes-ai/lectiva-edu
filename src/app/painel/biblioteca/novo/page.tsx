import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { MaterialForm } from "@/components/biblioteca/material-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo material" };

export default async function NovoMaterialPage() {
  await requirePermission("biblioteca.gerenciar");
  const disciplinas = await prisma.disciplina.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Novo material"
        descricao="Adicione um item ao acervo da biblioteca virtual."
      />
      <Card>
        <CardContent className="pt-6">
          <MaterialForm disciplinas={disciplinas} />
        </CardContent>
      </Card>
    </div>
  );
}
