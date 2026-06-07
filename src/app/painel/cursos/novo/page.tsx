import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { CursoForm } from "@/components/cursos/curso-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo curso" };

export default async function NovoCursoPage() {
  await requirePermission("cursos.gerenciar");
  const coordenadores = await prisma.usuario.findMany({
    where: { vinculo: { in: ["Coordenacao", "Admin"] }, situacao: "Ativo" },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo curso" descricao="Cadastre um novo curso no catálogo." />
      <Card>
        <CardContent className="pt-6">
          <CursoForm coordenadores={coordenadores} />
        </CardContent>
      </Card>
    </div>
  );
}
