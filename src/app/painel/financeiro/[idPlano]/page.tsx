import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Wallet } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarBRL, formatarData, formatarDataHora } from "@/lib/format";
import { rotulo } from "@/lib/enums";
import { SITUACAO_PLANO, SITUACAO_PARCELA, variantePlano, varianteParcela } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/painel/page-header";
import { GerarCobrancaButton } from "@/components/financeiro/gerar-cobranca-button";
import { DarBaixaButton } from "@/components/financeiro/dar-baixa-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Plano de pagamento" };

export default async function PlanoDetalhePage({
  params,
}: {
  params: Promise<{ idPlano: string }>;
}) {
  await requirePermission("financeiro.ver");
  const podeGerenciar = await temPermissao("financeiro.gerenciar");
  const { idPlano } = await params;

  const plano = await prisma.planoPagamento.findUnique({
    where: { id: idPlano },
    include: {
      aluno: { select: { nome: true } },
      curso: { select: { nome: true } },
      matricula: { select: { protocolo: true } },
      parcelas: { orderBy: { numero: "asc" } },
    },
  });
  if (!plano) notFound();

  const pagas = plano.parcelas.filter((p) => p.situacao === "Paga").length;

  const resumo = [
    { rotulo: "Aluno", valor: plano.aluno.nome },
    { rotulo: "Curso", valor: plano.curso.nome },
    { rotulo: "Protocolo", valor: plano.matricula.protocolo },
    { rotulo: "Valor total", valor: formatarBRL(Number(plano.valorTotal)) },
    { rotulo: "Descontos", valor: formatarBRL(Number(plano.descontos)) },
    { rotulo: "Saldo devedor", valor: formatarBRL(Number(plano.saldoDevedor)) },
    { rotulo: "Parcelas pagas", valor: `${pagas} de ${plano.numParcelas}` },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/painel/financeiro" />}>
        <ArrowLeft className="size-4" /> Voltar ao financeiro
      </Button>

      <PageHeader
        titulo="Plano de pagamento"
        descricao={`${plano.aluno.nome} · ${plano.curso.nome}`}
        acao={
          <Badge variant={variantePlano(plano.situacao)}>
            {rotulo(SITUACAO_PLANO, plano.situacao)}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-muted-foreground" /> Resumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resumo.map((r) => (
              <div key={r.rotulo}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.rotulo}</dt>
                <dd className="mt-0.5 font-medium text-foreground">{r.valor}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Parcelas</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Vencimento</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 font-semibold">Pagamento</th>
                <th className="px-4 py-3 font-semibold">Cobrança</th>
                {podeGerenciar && <th className="px-4 py-3 font-semibold">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {plano.parcelas.map((p) => {
                const ehLink = p.comprovante?.startsWith("http") ?? false;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.numero}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatarBRL(Number(p.valor))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatarData(p.vencimento)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={varianteParcela(p.situacao)}>
                        {rotulo(SITUACAO_PARCELA, p.situacao)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.dataPagamento ? (
                        <span>
                          {formatarDataHora(p.dataPagamento)}
                          {p.formaPagamento ? <span className="block text-xs">{p.formaPagamento}</span> : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.comprovante ? (
                        ehLink ? (
                          <a
                            href={p.comprovante}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                          >
                            Abrir <ExternalLink className="size-3.5" />
                          </a>
                        ) : (
                          <span className="break-all text-xs">{p.comprovante}</span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        {p.situacao === "Paga" ? (
                          <span className="text-xs text-muted-foreground">Quitada</span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              <GerarCobrancaButton idParcela={p.id} temLink={Boolean(p.comprovante)} />
                              <DarBaixaButton idParcela={p.id} />
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
