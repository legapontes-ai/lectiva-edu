import type { Metadata } from "next";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { requirePermission, requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanoForm, type DisciplinaOpcao, type TurmaOpcao } from "@/components/planos/plano-form";

export const metadata: Metadata = { title: "Novo plano de aula" };

export default async function NovoPlanoPage() {
  await requirePermission("planos.elaborar");
  const user = await requireUser();

  const professor = await prisma.professor.findUnique({
    where: { idUsuario: user.id },
    select: { id: true },
  });

  const disciplinasRaw = professor
    ? await prisma.disciplina.findMany({
        where: { idProfessor: professor.id },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          codigo: true,
          cargaHoraria: true,
          modulo: { select: { idCurso: true, curso: { select: { nome: true } } } },
          grades: { select: { grade: { select: { idCurso: true, curso: { select: { nome: true } } } } } },
        },
      })
    : [];

  const disciplinas: DisciplinaOpcao[] = [];
  for (const d of disciplinasRaw) {
    const grade = d.grades[0]?.grade;
    const idCurso = d.modulo?.idCurso ?? grade?.idCurso ?? null;
    if (!idCurso) continue;
    disciplinas.push({
      id: d.id,
      nome: d.codigo ? `${d.codigo} — ${d.nome}` : d.nome,
      idCurso,
      cursoNome: d.modulo?.curso.nome ?? grade?.curso.nome ?? null,
    });
  }

  const cursoIds = [...new Set(disciplinas.map((d) => d.idCurso))];
  const turmasRaw = cursoIds.length
    ? await prisma.turma.findMany({
        where: { idCurso: { in: cursoIds } },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, anoPeriodo: true, idCurso: true },
      })
    : [];
  const turmas: TurmaOpcao[] = turmasRaw.map((t) => ({
    id: t.id,
    nome: `${t.nome} · ${t.anoPeriodo}`,
    idCurso: t.idCurso,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo plano de aula" descricao="Vincule o plano a uma disciplina sua e a uma turma." />

      {!professor ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Seu usuário não está vinculado a um cadastro de professor.
          </p>
          <Button render={<Link href="/painel/planos" />} variant="secondary">
            Voltar
          </Button>
        </Card>
      ) : disciplinas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Você não possui disciplinas atribuídas com curso/turma definidos.
          </p>
          <Button render={<Link href="/painel/planos" />} variant="secondary">
            Voltar
          </Button>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <PlanoForm disciplinas={disciplinas} turmas={turmas} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
