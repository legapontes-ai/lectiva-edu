import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessorForm } from "@/components/professores/professor-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar docente" };

export default async function EditarProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("professores.gerenciar");
  const { id } = await params;
  const p = await prisma.professor.findUnique({ where: { id } });
  if (!p) notFound();

  const valores = {
    id: p.id,
    nome: p.nome,
    situacao: p.situacao,
    email: p.email ?? "",
    cpf: p.cpf ?? "",
    telefone: p.telefone ?? "",
    titulacao: p.titulacao ?? "",
    areaAtuacao: p.areaAtuacao ?? "",
    lattes: p.lattes ?? "",
    miniCurriculo: p.miniCurriculo ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar docente" descricao={p.nome} />
      <Card>
        <CardContent className="pt-6">
          <ProfessorForm professor={valores} />
        </CardContent>
      </Card>
    </div>
  );
}
