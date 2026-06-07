import type { Metadata } from "next";
import { ClipboardList, Filter, GraduationCap } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/painel/field";
import { AvaliacaoForm, type AlunoAvaliacao } from "@/components/avaliacao/avaliacao-form";
import { AvaliacaoChart, type DistribuicaoItem } from "@/components/avaliacao/avaliacao-chart";
import { SITUACAO_AVALIACAO_VALUES } from "@/lib/validations/avaliacao";

export const metadata: Metadata = { title: "Avaliação" };

const SITUACAO_LABEL: Record<string, string> = {
  Aprovado: "Aprovado",
  Reprovado: "Reprovado",
  Recuperacao: "Recuperação",
};

export default async function AvaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string; disciplina?: string }>;
}) {
  await requirePermission("avaliacao.ver");
  const podeGerenciar = await temPermissao("avaliacao.gerenciar");
  const sp = await searchParams;
  const { turma: idTurma, disciplina: idDisciplina } = sp;

  const [turmas, disciplinas] = await Promise.all([
    prisma.turma.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, curso: { select: { nome: true } } },
    }),
    prisma.disciplina.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const completo = Boolean(idTurma && idDisciplina);

  let alunos: AlunoAvaliacao[] = [];
  if (completo) {
    const [matriculas, existentes] = await Promise.all([
      prisma.matricula.findMany({
        where: { idTurma, situacao: { in: ["PreMatricula", "Ativa", "Concluida"] } },
        select: { aluno: { select: { id: true, nome: true } } },
        orderBy: { aluno: { nome: "asc" } },
      }),
      prisma.avaliacao.findMany({
        where: { idTurma, idDisciplina, tipo: "Disciplina" },
        select: { idAluno: true, nota: true, situacao: true, percentualFrequencia: true },
      }),
    ]);
    const mapa = new Map(existentes.filter((e) => e.idAluno).map((e) => [e.idAluno!, e]));
    alunos = matriculas.map((m) => {
      const reg = mapa.get(m.aluno.id);
      return {
        id: m.aluno.id,
        nome: m.aluno.nome,
        nota: reg?.nota != null ? Number(reg.nota) : undefined,
        situacao: reg?.situacao ?? undefined,
        percentualFrequencia:
          reg?.percentualFrequencia != null ? Number(reg.percentualFrequencia) : undefined,
      };
    });
  }

  // Indicadores agregados (filtrados por turma/disciplina quando selecionadas).
  const whereInd = {
    ...(idTurma ? { idTurma } : {}),
    ...(idDisciplina ? { idDisciplina } : {}),
  };
  const [grupos, media] = await Promise.all([
    prisma.avaliacao.groupBy({
      by: ["situacao"],
      where: whereInd,
      _count: { _all: true },
    }),
    prisma.avaliacao.aggregate({ where: whereInd, _avg: { nota: true } }),
  ]);
  const contagem = new Map(grupos.map((g) => [g.situacao, g._count._all]));
  const distribuicao: DistribuicaoItem[] = SITUACAO_AVALIACAO_VALUES.map((s) => ({
    nome: SITUACAO_LABEL[s],
    valor: contagem.get(s) ?? 0,
  }));
  const mediaNota = media._avg.nota != null ? Number(media._avg.nota) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Avaliação"
        descricao="Lance notas por disciplina e turma e acompanhe os indicadores de desempenho."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-muted-foreground" /> Selecionar turma e disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <Field label="Turma" htmlFor="turma">
              <Select id="turma" name="turma" defaultValue={idTurma ?? ""}>
                <option value="">— Selecione —</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} · {t.curso.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Disciplina" htmlFor="disciplina">
              <Select id="disciplina" name="disciplina" defaultValue={idDisciplina ?? ""}>
                <option value="">— Selecione —</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Carregar alunos</Button>
          </form>
        </CardContent>
      </Card>

      {completo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-muted-foreground" /> Lançamento de notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alunos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : podeGerenciar ? (
              <AvaliacaoForm idDisciplina={idDisciplina!} idTurma={idTurma!} alunos={alunos} />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Aluno</th>
                      <th className="px-4 py-3 font-semibold">Nota</th>
                      <th className="px-4 py-3 font-semibold">Situação</th>
                      <th className="px-4 py-3 font-semibold">Freq. (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {alunos.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{a.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.nota ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.situacao ? SITUACAO_LABEL[a.situacao] : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.percentualFrequencia != null ? `${a.percentualFrequencia}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Selecione turma e disciplina para lançar ou consultar notas.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores de desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <AvaliacaoChart distribuicao={distribuicao} mediaNota={mediaNota} />
        </CardContent>
      </Card>
    </div>
  );
}
