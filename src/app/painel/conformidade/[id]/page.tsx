import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, FileWarning, ClipboardList } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarData, formatarDataHora } from "@/lib/format";
import { EXECUCAO_INFO } from "@/lib/validations/plano";
import {
  calcularSinais,
  rotuloConformidade,
  rotuloPlano,
  varianteConformidade,
} from "@/lib/conformidade/status";
import { PageHeader } from "@/components/painel/page-header";
import { AnaliseForm } from "@/components/conformidade/analise-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Análise de conformidade" };

export default async function ConformidadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("planos.conformidade");
  const { id } = await params;

  const plano = await prisma.planoAula.findUnique({
    where: { id },
    include: {
      disciplina: { select: { nome: true, cargaHoraria: true, ementa: true } },
      turma: { select: { nome: true, anoPeriodo: true } },
      professor: { select: { nome: true } },
      conformidade: { include: { analista: { select: { nome: true } } } },
      atividades: { orderBy: { data: "asc" } },
      aulas: {
        orderBy: { ordem: "asc" },
        include: { materiais: { select: { id: true, titulo: true } } },
      },
    },
  });
  if (!plano) notFound();

  const totalAulas = plano.aulas.length;
  const contagem = { Integral: 0, Parcial: 0, NaoDado: 0, Pendente: 0 };
  for (const a of plano.aulas) {
    const k = (a.execucao in contagem ? a.execucao : "Pendente") as keyof typeof contagem;
    contagem[k]++;
  }
  const cargaSomada = plano.aulas.reduce((s, a) => s + (a.cargaHoraria ?? 0), 0);
  const sinais = calcularSinais({
    statusPlano: plano.status,
    conformidade: plano.conformidade?.status ?? null,
    totalAulas,
    contagem,
    cargaSomada,
    cargaDisciplina: plano.disciplina.cargaHoraria,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        titulo={plano.disciplina.nome}
        descricao={`${plano.turma.nome} · ${plano.turma.anoPeriodo} · Prof. ${plano.professor.nome}`}
        acao={
          <Button variant="ghost" render={<Link href="/painel/conformidade" />}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        }
      />

      {/* Resumo de aderência */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-4">
          <Dado rotulo="Status do plano" valor={rotuloPlano(plano.status)} />
          <Dado rotulo="Execução" valor={`${sinais.dadas}/${totalAulas} dada(s)`} />
          <Dado
            rotulo="Carga (aulas/disc.)"
            valor={`${sinais.cargaSomada}h / ${sinais.cargaDisciplina}h`}
            destaque={sinais.cargaDivergente}
          />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conformidade
            </p>
            <Badge variant={varianteConformidade(sinais.statusConformidade)}>
              {rotuloConformidade(sinais.statusConformidade)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sinais de alerta */}
      {(sinais.pendente || sinais.incompleto || sinais.emDesacordo) && (
        <div className="flex flex-wrap gap-2">
          {sinais.pendente && (
            <Badge variant="warning">
              <ClipboardList className="size-3" /> Análise pendente
            </Badge>
          )}
          {sinais.incompleto && (
            <Badge variant="muted">
              <FileWarning className="size-3" /> Plano incompleto
            </Badge>
          )}
          {sinais.emDesacordo && (
            <Badge variant="danger">
              <AlertTriangle className="size-3" /> Em desacordo
            </Badge>
          )}
        </div>
      )}

      {/* Conteúdo do plano (somente leitura) */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Bloco titulo="Ementa da disciplina" texto={plano.disciplina.ementa} />
          <Bloco titulo="Objetivos" texto={plano.objetivos} />
          <Bloco titulo="Metodologia" texto={plano.metodologia} />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aulas planejadas ({totalAulas})
            </p>
            {plano.aulas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma aula planejada.</p>
            ) : (
              <ol className="space-y-2">
                {plano.aulas.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {a.ordem}. {a.titulo}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {a.cargaHoraria != null && <span>{a.cargaHoraria}h</span>}
                        {a.dataPrevista && <span>{formatarData(a.dataPrevista)}</span>}
                        <Badge variant={(EXECUCAO_INFO[a.execucao] ?? EXECUCAO_INFO.Pendente).variant}>
                          {(EXECUCAO_INFO[a.execucao] ?? EXECUCAO_INFO.Pendente).label}
                        </Badge>
                      </span>
                    </div>
                    {a.conteudo && (
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{a.conteudo}</p>
                    )}
                    {a.materiais.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Materiais: {a.materiais.map((m) => m.titulo).join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Atividades avaliativas ({plano.atividades.length})
            </p>
            {plano.atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade avaliativa.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {plano.atividades.map((at) => (
                  <li key={at.id} className="flex flex-wrap justify-between gap-2">
                    <span className="text-foreground">{at.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      Peso {Number(at.peso)} · Máx. {Number(at.escalaMax)}
                      {at.data ? ` · ${formatarData(at.data)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulário de análise */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar análise de conformidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plano.conformidade?.dataAnalise && (
            <p className="text-xs text-muted-foreground">
              Última análise por {plano.conformidade.analista?.nome ?? "—"} em{" "}
              {formatarDataHora(plano.conformidade.dataAnalise)}.
            </p>
          )}
          <AnaliseForm
            idPlano={plano.id}
            status={plano.conformidade?.status ?? "Pendente"}
            observacoes={plano.conformidade?.observacoes}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className={destaque ? "font-medium text-destructive" : "font-medium text-foreground"}>
        {valor}
      </p>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      {texto ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{texto}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Não informado.</p>
      )}
    </div>
  );
}
