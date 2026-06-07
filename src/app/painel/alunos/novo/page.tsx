import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/painel/page-header";
import { AlunoForm } from "@/components/alunos/aluno-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo aluno" };

export default async function NovoAlunoPage() {
  await requirePermission("alunos.gerenciar");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo aluno" descricao="Cria o acesso e o cadastro do aluno." />
      <Card>
        <CardContent className="pt-6">
          <AlunoForm />
        </CardContent>
      </Card>
    </div>
  );
}
