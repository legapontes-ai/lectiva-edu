import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { ConsentimentoAcoes } from "@/components/lgpd/consentimento-acoes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Consentimentos (LGPD)" };

export default async function ConsentimentosPage() {
  await requirePermission("lgpd.gerenciar");

  const consentimentos = await prisma.consentimento.findMany({
    orderBy: { dataConsentimento: "desc" },
    include: { titular: { select: { nome: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Consentimentos (LGPD)"
        descricao="Registro e revogação de consentimentos de tratamento de dados pessoais."
      />

      {consentimentos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum consentimento registrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Titular</th>
                  <th className="px-4 py-3 font-semibold">Finalidade</th>
                  <th className="px-4 py-3 font-semibold">Versão</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consentimentos.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.titular.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.titular.email}</div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">{c.finalidade}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.versaoPolitica}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatarData(c.dataConsentimento)}
                      {c.dataRevogacao && (
                        <div className="text-xs text-destructive">revogado {formatarData(c.dataRevogacao)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.situacao === "Ativo" ? "success" : "danger"}>
                        {c.situacao === "Ativo" ? "Ativo" : "Revogado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConsentimentoAcoes id={c.id} ativo={c.situacao === "Ativo"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
