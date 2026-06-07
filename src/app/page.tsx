import Link from "next/link";
import {
  GraduationCap,
  CalendarDays,
  Clock,
  ArrowRight,
  Megaphone,
} from "lucide-react";

import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatarBRL, formatarData } from "@/lib/format";
import { rotulo, TIPO_CURSO, MODALIDADE_CURSO } from "@/lib/enums";

/** Gera um trecho curto do conteúdo de um comunicado. */
function trecho(texto: string, limite = 160): string {
  const limpo = texto.trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite).trimEnd()}…`;
}

export default async function Home() {
  const [cursos, comunicados] = await Promise.all([
    prisma.curso.findMany({
      where: { situacao: "Ativo" },
      orderBy: { criadoEm: "desc" },
      take: 3,
      select: {
        id: true,
        nome: true,
        tipo: true,
        modalidade: true,
        cargaHoraria: true,
        valorInvestimento: true,
      },
    }),
    prisma.comunicado.findMany({
      where: { situacao: "Publicado", publicoAlvo: "Todos" },
      orderBy: { dataPublicacao: "desc" },
      take: 3,
      select: {
        id: true,
        titulo: true,
        conteudo: true,
        dataPublicacao: true,
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero institucional */}
        <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-link">
                <GraduationCap className="size-3.5" /> Lectiva Edu
              </span>
              <h1 className="mt-5 font-heading text-4xl font-extrabold leading-tight tracking-tight text-primary sm:text-5xl">
                Gestão educacional{" "}
                <span className="text-link">integrada e inteligente</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Centralize a vida acadêmica, a certificação, o financeiro e a
                gestão administrativa de cursos de pós-graduação, MBA,
                capacitação, extensão e cursos livres em uma única plataforma.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/cursos" />}>
                  Conhecer os cursos <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" size="lg" render={<Link href="/login" />}>
                  Acessar plataforma
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cursos em destaque */}
        <section
          aria-labelledby="cursos-destaque"
          className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="cursos-destaque"
                className="font-heading text-2xl font-bold text-primary"
              >
                Cursos em destaque
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Programas ativos com inscrições abertas.
              </p>
            </div>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
            >
              Ver todos os cursos <ArrowRight className="size-4" />
            </Link>
          </div>

          {cursos.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center text-muted-foreground">
              Nenhum curso em destaque no momento. Volte em breve.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cursos.map((curso) => (
                <Card
                  key={curso.id}
                  className="flex flex-col transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">
                        {rotulo(TIPO_CURSO, curso.tipo)}
                      </Badge>
                      <Badge variant="muted">
                        {rotulo(MODALIDADE_CURSO, curso.modalidade)}
                      </Badge>
                    </div>
                    <CardTitle className="mt-1 text-foreground">
                      {curso.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 shrink-0" aria-hidden />
                        <dt className="sr-only">Carga horária</dt>
                        <dd>{curso.cargaHoraria}h de carga horária</dd>
                      </div>
                      {curso.valorInvestimento != null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Investimento</dt>
                          <dd className="font-semibold text-success">
                            {formatarBRL(Number(curso.valorInvestimento))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      render={<Link href={`/cursos/${curso.id}`} />}
                    >
                      Ver detalhes <ArrowRight className="size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Comunicados */}
        <section
          aria-labelledby="comunicados"
          className="border-y border-border bg-muted/30"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Megaphone className="size-5" aria-hidden />
              </span>
              <h2
                id="comunicados"
                className="font-heading text-2xl font-bold text-primary"
              >
                Comunicados
              </h2>
            </div>

            {comunicados.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                Nenhum comunicado publicado no momento.
              </p>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {comunicados.map((comunicado) => (
                  <Card key={comunicado.id} className="flex flex-col">
                    <CardHeader>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden />
                        <time dateTime={comunicado.dataPublicacao.toISOString()}>
                          {formatarData(comunicado.dataPublicacao)}
                        </time>
                      </p>
                      <CardTitle className="mt-1 text-foreground">
                        {comunicado.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {trecho(comunicado.conteudo)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
            <h2 className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Explore o catálogo completo de cursos ou acesse a plataforma para
              acompanhar sua vida acadêmica.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" render={<Link href="/cursos" />}>
                Ver cursos <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/login" />}>
                Entrar na plataforma
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
