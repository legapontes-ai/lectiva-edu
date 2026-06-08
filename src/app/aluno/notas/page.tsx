import type { Metadata } from "next";
import type { SituacaoAvaliacao } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { consolidarSituacao } from "@/lib/academico/consolidacao";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Notas — Área do Aluno" };

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const SIT_AVALIACAO: Record<SituacaoAvaliacao, { label: string; variante: BadgeVariant }> = {
  Aprovado: { label: "Aprovado", variante: "success" },
  Recuperacao: { label: "Recuperação", variante: "warning" },
  Reprovado: { label: "Reprovado", variante: "danger" },
};

export default async function AlunoNotasPage() {
  const { aluno } = await alunoDaSessao();

  const avaliacoes = aluno
    ? await prisma.avaliacao.findMany({
        where: { idAluno: aluno.id, nota: { not: null } },
        include: { disciplina: { select: { nome: true } } },
        orderBy: { dataAplicacao: "desc" },
      })
    : [];

  const notasAtividade = aluno
    ? await prisma.notaAtividade.findMany({
        where: { idAluno: aluno.id, nota: { not: null } },
        include: {
          atividade: {
            select: {
              nome: true,
              escalaMax: true,
              data: true,
              plano: { select: { disciplina: { select: { nome: true } } } },
            },
          },
        },
      })
    : [];

  // Situação por curso conforme as regras parametrizadas pelo administrador.
  const matriculas = aluno
    ? await prisma.matricula.findMany({
        where: { idAluno: aluno.id, situacao: { in: ["Ativa", "Concluida"] } },
        include: {
          curso: {
            select: {
              id: true,
              nome: true,
              notaMinimaAprovacao: true,
              frequenciaMinima: true,
              origemNota: true,
              exigeTodasDisciplinas: true,
            },
          },
        },
        orderBy: { dataMatricula: "desc" },
      })
    : [];

  const cursosVistos = new Set<string>();
  const situacaoCursos: { curso: string; aprovado: boolean; semGrade: boolean; disciplinas: Awaited<ReturnType<typeof consolidarSituacao>>["disciplinas"] }[] = [];
  for (const m of matriculas) {
    if (cursosVistos.has(m.curso.id)) continue;
    cursosVistos.add(m.curso.id);
    const r = await consolidarSituacao(aluno!.id, m.curso.id, {
      notaMinimaAprovacao: Number(m.curso.notaMinimaAprovacao),
      frequenciaMinima: m.curso.frequenciaMinima,
      origemNota: m.curso.origemNota,
      exigeTodasDisciplinas: m.curso.exigeTodasDisciplinas,
    });
    situacaoCursos.push({ curso: m.curso.nome, aprovado: r.aprovadoNoCurso, semGrade: r.semGrade, disciplinas: r.disciplinas });
  }

  const vazio = avaliacoes.length === 0 && notasAtividade.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Notas" descricao="Seu desempenho nas avaliações e atividades." />

      {situacaoCursos.filter((c) => !c.semGrade).map((c) => (
        <Card key={c.curso}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-base">{c.curso}</CardTitle>
                <CardDescription>Situação conforme as regras do curso.</CardDescription>
              </div>
              <Badge variant={c.aprovado ? "success" : "warning"}>
                {c.aprovado ? "Apto à certificação" : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {c.disciplinas.map((d) => (
                <li
                  key={d.idDisciplina}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Nota: {d.nota != null ? d.nota.toFixed(1) : "—"} · Frequência:{" "}
                      {d.frequencia != null ? `${d.frequencia}%` : "—"}
                      {d.motivo ? ` · ${d.motivo}` : ""}
                    </p>
                  </div>
                  <Badge variant={d.aprovada ? "success" : "muted"}>
                    {d.aprovada ? "Aprovada" : "Pendente"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {vazio ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <ClipboardList className="size-5 shrink-0" />
            <p className="text-sm">Nenhuma nota lançada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {avaliacoes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avaliações</CardTitle>
                <CardDescription>Resultado consolidado por disciplina.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {avaliacoes.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {a.disciplina?.nome ?? "Disciplina"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.dataAplicacao ? formatarData(a.dataAplicacao) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {Number(a.nota).toFixed(1)}
                        </span>
                        {a.situacao ? (
                          <Badge variant={SIT_AVALIACAO[a.situacao].variante}>
                            {SIT_AVALIACAO[a.situacao].label}
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {notasAtividade.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atividades do plano de aula</CardTitle>
                <CardDescription>Notas das atividades avaliativas.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {notasAtividade.map((n) => (
                    <li
                      key={n.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{n.atividade.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.atividade.plano?.disciplina?.nome ?? "—"}
                          {n.atividade.data ? ` · ${formatarData(n.atividade.data)}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {Number(n.nota).toFixed(1)}
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          / {Number(n.atividade.escalaMax).toFixed(1)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
