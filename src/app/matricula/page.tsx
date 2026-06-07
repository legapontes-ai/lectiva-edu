import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatriculaWizard } from "@/components/matricula/matricula-wizard";

export const metadata: Metadata = { title: "Matrícula" };

export default async function MatriculaPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; turma?: string }>;
}) {
  const { curso: cursoQuery, turma: turmaQuery } = await searchParams;

  const cursos = await prisma.curso.findMany({
    where: { situacao: { not: "Encerrado" } },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      tipo: true,
      modalidade: true,
      turmas: {
        where: { situacao: { not: "Concluida" } },
        orderBy: { criadoEm: "desc" },
        select: { id: true, nome: true, anoPeriodo: true },
      },
    },
  });

  // Pré-seleção a partir da query (somente se existir na lista).
  const cursoInicial = cursos.find((c) => c.id === cursoQuery)?.id;
  const turmaInicial = cursoInicial
    ? cursos.find((c) => c.id === cursoInicial)?.turmas.find((t) => t.id === turmaQuery)?.id
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-link">
              <GraduationCap className="size-3.5" /> Ingresso
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-primary">
              Matrícula online
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Preencha as etapas a seguir para realizar sua pré-matrícula. Ao final, você receberá um
              protocolo e um acesso à área do aluno.
            </p>
          </div>

          {cursos.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <GraduationCap className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No momento não há cursos com inscrições abertas.
              </p>
              <Button variant="outline" render={<Link href="/cursos" />}>
                Ver catálogo de cursos
              </Button>
            </Card>
          ) : (
            <MatriculaWizard
              cursos={cursos}
              cursoInicial={cursoInicial}
              turmaInicial={turmaInicial}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
