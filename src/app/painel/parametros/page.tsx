import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PERFIS_AUTOCADASTRO } from "@/lib/validations/autocadastro";
import { PageHeader } from "@/components/painel/page-header";
import { PoliticaSenhaTabela } from "@/components/autocadastro/politica-senha-tabela";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Parâmetros" };

export default async function ParametrosPage() {
  await requirePermission("parametros.gerenciar");

  const perfis = await prisma.perfil.findMany({
    where: { nome: { in: [...PERFIS_AUTOCADASTRO] } },
    select: { id: true, nome: true, politicaSenha: { select: { diasValidade: true } } },
    orderBy: { nome: "asc" },
  });

  const linhas = perfis.map((p) => ({ id: p.id, nome: p.nome, dias: p.politicaSenha?.diasValidade ?? 7 }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Parâmetros do sistema"
        descricao="Configurações operacionais delegadas ao Gestor do Sistema."
      />
      <Card>
        <CardHeader>
          <CardTitle>Validade da senha temporária (autocadastro)</CardTitle>
          <CardDescription>
            Prazo, por perfil, até a senha provisória expirar e bloquear o acesso (padrão: 7 dias).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PoliticaSenhaTabela perfis={linhas} />
        </CardContent>
      </Card>
    </div>
  );
}
