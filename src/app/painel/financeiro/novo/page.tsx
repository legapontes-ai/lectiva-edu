import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlanoForm, type MatriculaOpcao } from "@/components/financeiro/plano-form";

export const metadata: Metadata = { title: "Novo plano de pagamento" };

export default async function NovoPlanoPage() {
  await requirePermission("financeiro.gerenciar");

  const matriculas = await prisma.matricula.findMany({
    where: { planos: { none: {} } },
    orderBy: { dataMatricula: "desc" },
    select: {
      id: true,
      protocolo: true,
      aluno: { select: { nome: true } },
      curso: { select: { nome: true, valorInvestimento: true } },
    },
  });

  const opcoes: MatriculaOpcao[] = matriculas.map((m) => ({
    id: m.id,
    protocolo: m.protocolo,
    aluno: m.aluno.nome,
    curso: m.curso.nome,
    valorSugerido: m.curso.valorInvestimento != null ? Number(m.curso.valorInvestimento) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Novo plano de pagamento"
        descricao="Selecione a matrícula e defina o parcelamento. As parcelas serão geradas automaticamente."
      />
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <PlanoForm matriculas={opcoes} />
        </CardContent>
      </Card>
    </div>
  );
}
