import type { Metadata } from "next";
import { Receipt, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { rotulo } from "@/lib/enums";
import { formatarBRL, formatarData } from "@/lib/format";
import { SITUACAO_PARCELA, varianteParcela } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Financeiro — Área do Aluno" };

export default async function AlunoFinanceiroPage() {
  const { aluno } = await alunoDaSessao();
  const planos = aluno
    ? await prisma.planoPagamento.findMany({
        where: { idAluno: aluno.id },
        include: { curso: { select: { nome: true } }, parcelas: { orderBy: { numero: "asc" } } },
      })
    : [];
  const saldoDevedor = planos.reduce((s, p) => s + Number(p.saldoDevedor), 0);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Financeiro" descricao="Seus planos de pagamento e parcelas." />

      {planos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <Receipt className="size-5 shrink-0" />
            <p className="text-sm">Você ainda não possui planos de pagamento registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {planos.map((plano) => (
            <Card key={plano.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{plano.curso.nome}</CardTitle>
                    <CardDescription>
                      Saldo devedor:{" "}
                      <span className="font-medium text-foreground">
                        {formatarBRL(Number(plano.saldoDevedor))}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={plano.situacao === "Adimplente" ? "success" : "danger"}>
                    {plano.situacao === "Adimplente" ? "Adimplente" : "Inadimplente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {plano.parcelas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma parcela cadastrada.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {plano.parcelas.map((p) => {
                      const emAberto = p.situacao === "EmAberto" || p.situacao === "Vencida";
                      return (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-[8rem] space-y-0.5">
                            <p className="text-sm font-medium text-foreground">
                              Parcela {p.numero} — {formatarBRL(Number(p.valor))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vencimento: {formatarData(p.vencimento)}
                              {p.dataPagamento ? ` · Pago em ${formatarData(p.dataPagamento)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={varianteParcela(p.situacao)}>
                              {rotulo(SITUACAO_PARCELA, p.situacao)}
                            </Badge>
                            {emAberto ? (
                              p.comprovante ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  render={
                                    <a href={p.comprovante} target="_blank" rel="noopener noreferrer" />
                                  }
                                >
                                  <ExternalLink className="size-4" /> 2ª via
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Procure a secretaria
                                </span>
                              )
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
          {saldoDevedor > 0 ? (
            <p className="text-sm text-muted-foreground">
              Saldo devedor total:{" "}
              <span className="font-semibold text-foreground">{formatarBRL(saldoDevedor)}</span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
