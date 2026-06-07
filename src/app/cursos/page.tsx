import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CalendarRange, GraduationCap } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { formatarBRL } from "@/lib/format";
import { TIPO_CURSO, MODALIDADE_CURSO, rotulo } from "@/lib/enums";

export const metadata: Metadata = { title: "Cursos" };

type SearchParams = Promise<{ tipo?: string }>;

const TIPOS_VALIDOS: string[] = TIPO_CURSO.map((t) => t.value);

export default async function CursosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tipo } = await searchParams;
  const tipoFiltro = tipo && TIPOS_VALIDOS.includes(tipo) ? tipo : undefined;

  const cursos = await prisma.curso.findMany({
    where: {
      situacao: { not: "Encerrado" },
      ...(tipoFiltro ? { tipo: tipoFiltro as never } : {}),
    },
    orderBy: { nome: "asc" },
  });

  // Agrupa por tipo, preservando a ordem dos enums.
  const grupos = TIPO_CURSO.map((t) => ({
    tipo: t,
    cursos: cursos.filter((c) => c.tipo === t.value),
  })).filter((g) => g.cursos.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Cabeçalho da página */}
        <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Catálogo de cursos
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Conheça nossa oferta de MBA, pós lato sensu, capacitação, extensão
              e cursos livres. Escolha um programa e dê o próximo passo na sua
              formação.
            </p>

            {/* Filtro por tipo */}
            <nav
              aria-label="Filtrar por tipo de curso"
              className="mt-8 flex flex-wrap gap-2"
            >
              <Button
                variant={tipoFiltro ? "outline" : "default"}
                size="sm"
                render={<Link href="/cursos" />}
              >
                Todos
              </Button>
              {TIPO_CURSO.map((t) => (
                <Button
                  key={t.value}
                  variant={tipoFiltro === t.value ? "default" : "outline"}
                  size="sm"
                  render={<Link href={`/cursos?tipo=${t.value}`} />}
                >
                  {t.label}
                </Button>
              ))}
            </nav>
          </div>
        </section>

        {/* Lista de cursos */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          {grupos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <GraduationCap className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Nenhum curso disponível
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tipoFiltro
                  ? "Não há cursos para o filtro selecionado no momento."
                  : "Em breve novos cursos estarão disponíveis."}
              </p>
              {tipoFiltro && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  render={<Link href="/cursos" />}
                >
                  Ver todos os cursos
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {grupos.map((grupo) => (
                <div key={grupo.tipo.value}>
                  <h2 className="font-heading text-2xl font-bold text-primary">
                    {grupo.tipo.label}
                  </h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {grupo.cursos.map((curso) => (
                      <Card key={curso.id} className="flex flex-col">
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="info">
                              {rotulo(TIPO_CURSO, curso.tipo)}
                            </Badge>
                            <Badge variant="muted">
                              {rotulo(MODALIDADE_CURSO, curso.modalidade)}
                            </Badge>
                          </div>
                          <CardTitle className="mt-2">{curso.nome}</CardTitle>
                          {curso.areaConhecimento && (
                            <CardDescription>
                              {curso.areaConhecimento}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock className="size-4 shrink-0" />
                            {curso.cargaHoraria} horas
                          </p>
                          {curso.duracaoMeses != null && (
                            <p className="flex items-center gap-2">
                              <CalendarRange className="size-4 shrink-0" />
                              {curso.duracaoMeses}{" "}
                              {curso.duracaoMeses === 1 ? "mês" : "meses"}
                            </p>
                          )}
                          {curso.valorInvestimento != null && (
                            <p className="pt-1 text-base font-semibold text-foreground">
                              {formatarBRL(Number(curso.valorInvestimento))}
                            </p>
                          )}
                        </CardContent>

                        <CardFooter>
                          <Button
                            variant="outline"
                            className="w-full"
                            render={<Link href={`/cursos/${curso.id}`} />}
                          >
                            Ver detalhes
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
