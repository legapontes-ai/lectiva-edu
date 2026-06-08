import type { Metadata } from "next";
import { BookText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { PageHeader } from "@/components/painel/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Minhas disciplinas — Área do Aluno" };

export default async function AlunoDisciplinasPage() {
  const { aluno } = await alunoDaSessao();

  const matriculas = aluno
    ? await prisma.matricula.findMany({
        where: { idAluno: aluno.id, situacao: { in: ["Ativa", "Concluida"] } },
        include: { curso: { select: { id: true, nome: true } } },
        orderBy: { dataMatricula: "desc" },
      })
    : [];

  // Disciplinas já aprovadas (consideradas "cumpridas").
  const aprovadas = aluno
    ? new Set(
        (
          await prisma.avaliacao.findMany({
            where: { idAluno: aluno.id, situacao: "Aprovado" },
            select: { idDisciplina: true },
          })
        )
          .map((a) => a.idDisciplina)
          .filter((id): id is string => !!id),
      )
    : new Set<string>();

  // Grade vigente (maior versão) por curso matriculado.
  const cursosVistos = new Set<string>();
  const blocos: {
    curso: string;
    disciplinas: { id: string; nome: string; ch: number; periodo: number | null; cumprida: boolean }[];
  }[] = [];

  for (const m of matriculas) {
    if (cursosVistos.has(m.curso.id)) continue;
    cursosVistos.add(m.curso.id);
    const grade = await prisma.gradeCurricular.findFirst({
      where: { idCurso: m.curso.id },
      orderBy: { versao: "desc" },
      include: {
        disciplinas: {
          include: { disciplina: { select: { id: true, nome: true, cargaHoraria: true } } },
        },
      },
    });
    const disciplinas = (grade?.disciplinas ?? [])
      .map((gd) => ({
        id: gd.disciplina.id,
        nome: gd.disciplina.nome,
        ch: gd.disciplina.cargaHoraria,
        periodo: gd.periodo,
        cumprida: aprovadas.has(gd.disciplina.id),
      }))
      .sort((a, b) => (a.periodo ?? 99) - (b.periodo ?? 99) || a.nome.localeCompare(b.nome));
    blocos.push({ curso: m.curso.nome, disciplinas });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Minhas disciplinas"
        descricao="As disciplinas da sua grade e o que ainda falta cumprir."
      />

      {blocos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <BookText className="size-5 shrink-0" />
            <p className="text-sm">Nenhuma disciplina disponível na sua grade ainda.</p>
          </CardContent>
        </Card>
      ) : (
        blocos.map((b) => {
          const cumpridas = b.disciplinas.filter((d) => d.cumprida).length;
          return (
            <Card key={b.curso}>
              <CardHeader>
                <CardTitle className="text-base">{b.curso}</CardTitle>
                <CardDescription>
                  {cumpridas} de {b.disciplinas.length} disciplina(s) cumprida(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {b.disciplinas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Grade ainda não definida.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {b.disciplinas.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{d.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.periodo ? `Período ${d.periodo} · ` : ""}
                            {d.ch}h
                          </p>
                        </div>
                        <Badge variant={d.cumprida ? "success" : "muted"}>
                          {d.cumprida ? "Cumprida" : "A cursar"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
