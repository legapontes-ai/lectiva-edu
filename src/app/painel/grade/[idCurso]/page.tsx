import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import { STATUS_GRADE } from "@/lib/grade/schema";
import { PageHeader } from "@/components/painel/page-header";
import { CriarVersaoButton } from "@/components/grade/criar-versao-button";
import { StatusGradeControl } from "@/components/grade/status-grade-control";
import { AdicionarDisciplinaForm } from "@/components/grade/adicionar-disciplina-form";
import { GradeDisciplinasTabela } from "@/components/grade/grade-disciplinas-tabela";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Grade do curso" };

function badgeStatus(status: string) {
  return status === "Publicada" ? "success" : status === "Validada" ? "info" : "muted";
}

export default async function GradeCursoPage({ params }: { params: Promise<{ idCurso: string }> }) {
  await requirePermission("grade.gerenciar");
  const { idCurso } = await params;

  const curso = await prisma.curso.findUnique({
    where: { id: idCurso },
    select: { id: true, nome: true, cargaHoraria: true },
  });
  if (!curso) notFound();

  // Disciplinas que pertencem a um módulo deste curso.
  const disciplinasCurso = await prisma.disciplina.findMany({
    where: { modulo: { idCurso } },
    orderBy: [{ modulo: { ordem: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, codigo: true, cargaHoraria: true },
  });

  const grades = await prisma.gradeCurricular.findMany({
    where: { idCurso },
    orderBy: { versao: "desc" },
    include: {
      disciplinas: {
        include: { disciplina: { select: { id: true, nome: true, codigo: true, cargaHoraria: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/painel/grade" />} className="mb-2 -ml-2">
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <PageHeader
          titulo={`Grade — ${curso.nome}`}
          descricao={`Carga horária prevista do curso: ${curso.cargaHoraria}h.`}
          acao={<CriarVersaoButton idCurso={curso.id} />}
        />
      </div>

      {disciplinasCurso.length === 0 && (
        <Card className="border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 dark:bg-transparent">
          Este curso ainda não possui disciplinas vinculadas a módulos. Cadastre disciplinas para montar a grade.
        </Card>
      )}

      {grades.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Layers className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma versão de grade criada para este curso.</p>
          <CriarVersaoButton idCurso={curso.id} label="Criar primeira versão" />
        </Card>
      ) : (
        grades.map((g) => {
          const editavel = g.status !== "Publicada";
          const itens = g.disciplinas.map((gd) => ({
            idDisciplina: gd.idDisciplina,
            nome: gd.disciplina.nome,
            codigo: gd.disciplina.codigo,
            cargaHoraria: gd.disciplina.cargaHoraria,
            periodo: gd.periodo,
            preRequisito: gd.preRequisito,
          }));
          const idsNaGrade = new Set(itens.map((i) => i.idDisciplina));
          const disponiveis = disciplinasCurso.filter((d) => !idsNaGrade.has(d.id));

          return (
            <Card key={g.id}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-heading text-lg font-semibold text-primary">Versão {g.versao}</span>
                  <Badge variant={badgeStatus(g.status)}>{rotulo(STATUS_GRADE, g.status)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {g.cargaHorariaTotal}h · {itens.length} disciplina{itens.length === 1 ? "" : "s"}
                  </span>
                  {g.dataValidacao && (
                    <span className="text-xs text-muted-foreground">
                      Validada em {formatarData(g.dataValidacao)}
                    </span>
                  )}
                </div>
                <StatusGradeControl idGrade={g.id} status={g.status} />
              </CardHeader>
              <CardContent className="space-y-5">
                <GradeDisciplinasTabela idGrade={g.id} itens={itens} editavel={editavel} />
                {editavel && (
                  <div className="rounded-lg border border-dashed border-border p-4">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Adicionar disciplina</h3>
                    <AdicionarDisciplinaForm idGrade={g.id} disponiveis={disponiveis} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
