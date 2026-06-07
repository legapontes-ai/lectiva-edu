import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  CalendarRange,
  Wallet,
  UserRound,
  ArrowRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatarBRL } from "@/lib/format";
import {
  TIPO_CURSO,
  MODALIDADE_CURSO,
  SITUACAO_TURMA,
  rotulo,
} from "@/lib/enums";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const curso = await prisma.curso.findUnique({
    where: { id },
    select: { nome: true },
  });
  return { title: curso ? curso.nome : "Curso" };
}

const SITUACAO_TURMA_VARIANTE: Record<
  string,
  "default" | "success" | "warning" | "muted"
> = {
  EmFormacao: "warning",
  EmAndamento: "success",
  Concluida: "muted",
};

export default async function CursoDetalhePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const curso = await prisma.curso.findUnique({
    where: { id },
    include: {
      coordenador: { select: { nome: true } },
      turmas: { orderBy: { anoPeriodo: "desc" } },
    },
  });

  if (!curso) notFound();

  const resumo = [
    { icon: Clock, rotulo: "Carga horária", valor: `${curso.cargaHoraria} horas` },
    {
      icon: CalendarRange,
      rotulo: "Duração",
      valor:
        curso.duracaoMeses != null
          ? `${curso.duracaoMeses} ${curso.duracaoMeses === 1 ? "mês" : "meses"}`
          : "—",
    },
    {
      icon: Wallet,
      rotulo: "Investimento",
      valor:
        curso.valorInvestimento != null
          ? formatarBRL(Number(curso.valorInvestimento))
          : "Sob consulta",
    },
    {
      icon: UserRound,
      rotulo: "Coordenação",
      valor: curso.coordenador?.nome ?? "A definir",
    },
  ];

  const secoes = [
    { titulo: "Objetivos", texto: curso.objetivos },
    { titulo: "Metodologia", texto: curso.metodologia },
    { titulo: "Requisitos de conclusão", texto: curso.requisitosConclusao },
  ].filter((s) => s.texto);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Cabeçalho */}
        <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
            <Link
              href="/cursos"
              className="text-sm font-medium text-link hover:underline"
            >
              ← Voltar ao catálogo
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="info">{rotulo(TIPO_CURSO, curso.tipo)}</Badge>
              <Badge variant="muted">
                {rotulo(MODALIDADE_CURSO, curso.modalidade)}
              </Badge>
            </div>

            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              {curso.nome}
            </h1>
            {curso.areaConhecimento && (
              <p className="mt-2 text-lg text-muted-foreground">
                {curso.areaConhecimento}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                render={<Link href={`/matricula?curso=${curso.id}`} />}
              >
                Quero me matricular <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          {/* Resumo */}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resumo.map((item) => (
              <div
                key={item.rotulo}
                className="rounded-xl border border-border bg-card p-5"
              >
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="size-4 shrink-0" />
                  {item.rotulo}
                </dt>
                <dd className="mt-2 font-semibold text-foreground">
                  {item.valor}
                </dd>
              </div>
            ))}
          </dl>

          {/* Seções textuais */}
          {secoes.length > 0 && (
            <div className="mt-12 space-y-10">
              {secoes.map((secao) => (
                <section key={secao.titulo}>
                  <h2 className="font-heading text-2xl font-bold text-primary">
                    {secao.titulo}
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-muted-foreground">
                    {secao.texto}
                  </p>
                </section>
              ))}
            </div>
          )}

          {/* Turmas */}
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Turmas
            </h2>
            {curso.turmas.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                Ainda não há turmas cadastradas para este curso.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {curso.turmas.map((turma) => (
                  <Card key={turma.id}>
                    <CardContent className="flex items-center justify-between gap-3 pt-6">
                      <div>
                        <p className="font-semibold text-foreground">
                          {turma.nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {turma.anoPeriodo}
                        </p>
                      </div>
                      <Badge
                        variant={
                          SITUACAO_TURMA_VARIANTE[turma.situacao] ?? "default"
                        }
                      >
                        {rotulo(SITUACAO_TURMA, turma.situacao)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Chamada final */}
          <div className="mt-14 rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Pronto para começar?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Garanta sua vaga em {curso.nome}.
            </p>
            <Button
              size="lg"
              className="mt-6"
              render={<Link href={`/matricula?curso=${curso.id}`} />}
            >
              Quero me matricular <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
