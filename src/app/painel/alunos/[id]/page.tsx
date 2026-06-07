import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { AlunoForm } from "@/components/alunos/aluno-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar aluno" };

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("alunos.gerenciar");
  const { id } = await params;
  const a = await prisma.aluno.findUnique({ where: { id } });
  if (!a) notFound();

  const valores = {
    id: a.id,
    nome: a.nome,
    email: a.email ?? "",
    cpf: a.cpf ?? "",
    rg: a.rg ?? "",
    dataNascimento: a.dataNascimento ? a.dataNascimento.toISOString().slice(0, 10) : "",
    telefone: a.telefone ?? "",
    endereco: a.endereco ?? "",
    situacaoAcademica: a.situacaoAcademica,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar aluno" descricao={a.nome} />
      <Card>
        <CardContent className="pt-6">
          <AlunoForm aluno={valores} />
        </CardContent>
      </Card>
    </div>
  );
}
