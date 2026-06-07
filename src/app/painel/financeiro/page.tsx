import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Wallet, Filter, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarBRL } from "@/lib/format";
import { rotulo } from "@/lib/enums";
import { SITUACAO_PLANO, variantePlano } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/painel/page-header";
import { AtualizarVencidasButton } from "@/components/financeiro/atualizar-vencidas-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/painel/field";
import type { SituacaoPlano } from "@prisma/client";

export const metadata: Metadata = { title: "Financeiro" };

function somaParcela(
  grupos: { situacao: string; _sum: { valor: unknown } }[],
  situacao: string,
): number {
  const g = grupos.find((x) => x.situacao === situacao);
  return g ? Number(g._sum.valor ?? 0) : 0;
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  await requirePermission("financeiro.ver");
  const podeGerenciar = await temPermissao("financeiro.gerenciar");
  const { situacao } = await searchParams;
  const filtro =
    situacao === "Adimplente" || situacao === "Inadimplente"
      ? (situacao as SituacaoPlano)
      : undefined;

  const [planos, totais] = await Promise.all([
    prisma.planoPagamento.findMany({
      where: filtro ? { situacao: filtro } : {},
      orderBy: { situacao: "desc" },
      include: {
        aluno: { select: { nome: true } },
        curso: { select: { nome: true } },
      },
    }),
    prisma.parcela.groupBy({ by: ["situacao"], _sum: { valor: true } }),
  ]);

  const recebido = somaParcela(totais, "Paga");
  const emAberto = somaParcela(totais, "EmAberto");
  const vencido = somaParcela(totais, "Vencida");

  const cards = [
    { titulo: "Recebido", valor: recebido, Icon: TrendingUp, cor: "text-success" },
    { titulo: "Em aberto", valor: emAberto, Icon: Clock, cor: "text-amber-600" },
    { titulo: "Vencido", valor: vencido, Icon: AlertTriangle, cor: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Financeiro"
        descricao="Planos de pagamento, parcelas e inadimplência."
        acao={
          podeGerenciar ? (
            <div className="flex gap-2">
              <AtualizarVencidasButton />
              <Button render={<Link href="/painel/financeiro/novo" />}>
                <Plus className="size-4" /> Novo plano
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ titulo, valor, Icon, cor }) => (
          <Card key={titulo}>
            <CardContent className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">{titulo}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatarBRL(valor)}</p>
              </div>
              <Icon className={`size-8 ${cor}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <Field label="Situação" htmlFor="situacao" className="min-w-48">
              <Select id="situacao" name="situacao" defaultValue={situacao ?? ""}>
                <option value="">Todas</option>
                {SITUACAO_PLANO.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="outline">
              <Filter className="size-4" /> Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {planos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Wallet className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum plano de pagamento encontrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Aluno</th>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Parcelas</th>
                  <th className="px-4 py-3 font-semibold">Valor total</th>
                  <th className="px-4 py-3 font-semibold">Saldo devedor</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  <th className="px-4 py-3 font-semibold text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {planos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.aluno.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.curso.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.numParcelas}x</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatarBRL(Number(p.valorTotal))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatarBRL(Number(p.saldoDevedor))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={variantePlano(p.situacao)}>
                        {rotulo(SITUACAO_PLANO, p.situacao)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" render={<Link href={`/painel/financeiro/${p.id}`} />}>
                        Ver
                      </Button>
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
