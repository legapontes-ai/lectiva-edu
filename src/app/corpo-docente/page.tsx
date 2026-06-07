import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, GraduationCap } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Corpo Docente",
  description:
    "Conheça os professores do Lectiva Edu: titulação, área de atuação e currículo resumido.",
};

function inicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

export default async function CorpoDocentePage() {
  const professores = await prisma.professor.findMany({
    where: { situacao: "Ativo" },
    orderBy: { nome: "asc" },
    include: { _count: { select: { disciplinas: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-hero-brand border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Corpo docente
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Professores que conduzem a vida acadêmica do Lectiva Edu — com
              titulação, área de atuação e trajetória profissional.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          {professores.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <GraduationCap className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum professor disponível no momento.
              </p>
            </Card>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {professores.map((p) => (
                <li key={p.id}>
                  <Card className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-center gap-4">
                      {p.fotoUrl ? (
                        <Image
                          src={p.fotoUrl}
                          alt={`Foto de ${p.nome}`}
                          width={64}
                          height={64}
                          className="size-16 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-2xl font-bold text-accent-foreground"
                        >
                          {inicial(p.nome)}
                        </span>
                      )}

                      <div className="min-w-0">
                        <h2 className="font-heading text-lg font-semibold leading-tight text-foreground">
                          {p.nome}
                        </h2>
                        {p.titulacao && (
                          <p className="mt-0.5 text-sm font-medium text-primary">
                            {p.titulacao}
                          </p>
                        )}
                      </div>
                    </div>

                    {p.areaAtuacao && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Área de atuação:{" "}
                        </span>
                        {p.areaAtuacao}
                      </p>
                    )}

                    {p.miniCurriculo && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {p.miniCurriculo}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm">
                      <span className="text-muted-foreground">
                        {p._count.disciplinas === 1
                          ? "1 disciplina"
                          : `${p._count.disciplinas} disciplinas`}
                      </span>

                      {p.lattes && (
                        <Link
                          href={p.lattes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-link transition-colors hover:underline"
                        >
                          Currículo Lattes
                          <ExternalLink className="size-3.5" />
                          <span className="sr-only">(abre em nova aba)</span>
                        </Link>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
