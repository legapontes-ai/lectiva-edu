import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { PageHeader } from "@/components/painel/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Frequência — Área do Aluno" };

export default async function AlunoFrequenciaPage() {
  const { aluno } = await alunoDaSessao();

  const registros = aluno
    ? await prisma.frequencia.findMany({
        where: { idAluno: aluno.id },
        include: { disciplina: { select: { id: true, nome: true } } },
        orderBy: { dataAula: "desc" },
      })
    : [];

  // Agrupa por disciplina.
  const porDisciplina = new Map<
    string,
    { nome: string; total: number; presentes: number; ausentes: number; justificados: number; percentual: number | null }
  >();
  for (const r of registros) {
    const k = r.disciplina.id;
    const g =
      porDisciplina.get(k) ??
      { nome: r.disciplina.nome, total: 0, presentes: 0, ausentes: 0, justificados: 0, percentual: null as number | null };
    g.total++;
    if (r.situacao === "Presente") g.presentes++;
    else if (r.situacao === "Ausente") g.ausentes++;
    else if (r.situacao === "Justificado") g.justificados++;
    // O primeiro registro (mais recente) com percentual acumulado prevalece.
    if (g.percentual === null && r.percentualAcumulado !== null) g.percentual = Number(r.percentualAcumulado);
    porDisciplina.set(k, g);
  }

  const linhas = [...porDisciplina.values()]
    .map((g) => ({ ...g, percentual: g.percentual ?? (g.total ? Math.round((g.presentes / g.total) * 100) : 0) }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="space-y-6">
      <PageHeader titulo="Frequência" descricao="Sua presença acumulada por disciplina." />

      {linhas.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <CalendarCheck className="size-5 shrink-0" />
            <p className="text-sm">Nenhum registro de frequência lançado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {linhas.map((l) => {
            const baixa = l.percentual < 75;
            return (
              <Card key={l.nome}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{l.nome}</CardTitle>
                      <CardDescription>
                        {l.presentes} presença(s) · {l.ausentes} falta(s) · {l.justificados} justificada(s) de{" "}
                        {l.total} aula(s)
                      </CardDescription>
                    </div>
                    <Badge variant={baixa ? "danger" : "success"}>{l.percentual}%</Badge>
                  </div>
                </CardHeader>
                {baixa ? (
                  <CardContent>
                    <p className="text-xs text-destructive">
                      Atenção: frequência abaixo de 75%.
                    </p>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
