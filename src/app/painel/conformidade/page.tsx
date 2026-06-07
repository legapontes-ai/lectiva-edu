import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, ClipboardList, AlertTriangle, FileWarning } from "lucide-react";
import type { StatusConformidade } from "@prisma/client";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  calcularSinais,
  rotuloConformidade,
  rotuloPlano,
  varianteConformidade,
} from "@/lib/conformidade/status";
import { PageHeader } from "@/components/painel/page-header";
import { ConformidadeFiltros } from "@/components/conformidade/conformidade-filtros";
import { ConformidadeChart } from "@/components/conformidade/conformidade-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Conformidade" };

const STATUS_VALIDOS: StatusConformidade[] = ["Pendente", "Conforme", "NaoConforme"];

export default async function ConformidadePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("planos.conformidade");
  const { status } = await searchParams;
  const filtro = STATUS_VALIDOS.includes(status as StatusConformidade)
    ? (status as StatusConformidade)
    : "";

  const planos = await prisma.planoAula.findMany({
    orderBy: { atualizadoEm: "desc" },
    include: {
      disciplina: { select: { nome: true, cargaHoraria: true } },
      turma: { select: { nome: true, anoPeriodo: true } },
      professor: { select: { nome: true } },
      conformidade: { select: { status: true } },
      aulas: { select: { cargaHoraria: true, concluida: true } },
      _count: { select: { aulas: true } },
    },
  });

  const itens = planos.map((p) => {
    const totalAulas = p._count.aulas;
    const aulasConcluidas = p.aulas.filter((a) => a.concluida).length;
    const cargaSomada = p.aulas.reduce((s, a) => s + (a.cargaHoraria ?? 0), 0);
    const sinais = calcularSinais({
      statusPlano: p.status,
      conformidade: p.conformidade?.status ?? null,
      totalAulas,
      aulasConcluidas,
      cargaSomada,
      cargaDisciplina: p.disciplina.cargaHoraria,
    });
    return { plano: p, totalAulas, aulasConcluidas, sinais };
  });

  const resumo = {
    conformes: itens.filter((i) => i.sinais.statusConformidade === "Conforme").length,
    naoConformes: itens.filter((i) => i.sinais.statusConformidade === "NaoConforme").length,
    pendentes: itens.filter((i) => i.sinais.statusConformidade === "Pendente").length,
  };

  const visiveis = filtro
    ? itens.filter((i) => i.sinais.statusConformidade === filtro)
    : itens;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Conformidade dos planos"
        descricao="Acompanhe a aderência dos planos de aula elaborados pelos professores."
      />

      {/* Relatório / panorama */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Panorama</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <Resumo rotulo="Conformes" valor={resumo.conformes} cor="text-success" />
            <Resumo rotulo="Não conformes" valor={resumo.naoConformes} cor="text-destructive" />
            <Resumo rotulo="Pendentes" valor={resumo.pendentes} cor="text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ConformidadeChart resumo={resumo} />
          </CardContent>
        </Card>
      </div>

      <ConformidadeFiltros atual={filtro} />

      {visiveis.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {itens.length === 0
              ? "Nenhum plano de aula cadastrado ainda."
              : "Nenhum plano corresponde a este filtro."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Disciplina / Turma</th>
                  <th className="px-4 py-3 font-semibold">Professor</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3 font-semibold">Evolução</th>
                  <th className="px-4 py-3 font-semibold">Carga (aulas/disc.)</th>
                  <th className="px-4 py-3 font-semibold">Sinais</th>
                  <th className="px-4 py-3 font-semibold">Conformidade</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visiveis.map(({ plano, totalAulas, aulasConcluidas, sinais }) => (
                  <tr key={plano.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{plano.disciplina.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {plano.turma.nome} · {plano.turma.anoPeriodo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{plano.professor.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rotuloPlano(plano.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={sinais.evolucao}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Evolução ${sinais.evolucao}%`}
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${sinais.evolucao}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {sinais.evolucao}%
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {aulasConcluidas}/{totalAulas} aula(s)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          sinais.cargaDivergente
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {sinais.cargaSomada}h / {sinais.cargaDisciplina}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sinais.pendente && (
                          <Badge variant="warning">
                            <ClipboardList className="size-3" /> Pendente
                          </Badge>
                        )}
                        {sinais.incompleto && (
                          <Badge variant="muted">
                            <FileWarning className="size-3" /> Incompleto
                          </Badge>
                        )}
                        {sinais.emDesacordo && (
                          <Badge variant="danger">
                            <AlertTriangle className="size-3" /> Em desacordo
                          </Badge>
                        )}
                        {!sinais.pendente && !sinais.incompleto && !sinais.emDesacordo && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={varianteConformidade(sinais.statusConformidade)}>
                        {rotuloConformidade(sinais.statusConformidade)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="consulta"
                          size="sm"
                          render={<Link href={`/painel/conformidade/${plano.id}`} />}
                        >
                          <ClipboardCheck className="size-4" /> Analisar
                        </Button>
                      </div>
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

function Resumo({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted p-4 text-center">
      <span className={`text-3xl font-bold ${cor}`}>{valor}</span>
      <span className="text-xs text-muted-foreground">{rotulo}</span>
    </div>
  );
}
