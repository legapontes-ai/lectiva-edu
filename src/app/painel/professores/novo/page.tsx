import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessorForm } from "@/components/professores/professor-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo docente" };

export default async function NovoProfessorPage() {
  await requirePermission("professores.gerenciar");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo docente" descricao="Cadastre um professor." />
      <Card>
        <CardContent className="pt-6">
          <ProfessorForm />
        </CardContent>
      </Card>
    </div>
  );
}
