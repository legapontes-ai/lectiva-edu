import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { TurmaForm } from "@/components/turmas/turma-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nova turma" };

export default async function NovaTurmaPage() {
  await requirePermission("turmas.gerenciar");
  const [cursos, coordenadores] = await Promise.all([
    prisma.curso.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.usuario.findMany({
      where: { vinculo: { in: ["Coordenacao", "Admin"] }, situacao: "Ativo" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova turma" descricao="Crie uma turma para um curso." />
      <Card>
        <CardContent className="pt-6">
          <TurmaForm cursos={cursos} coordenadores={coordenadores} />
        </CardContent>
      </Card>
    </div>
  );
}
