import type { Metadata } from "next";
import { CalendarCheck, Filter, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/painel/field";
import { FrequenciaForm, type AlunoFrequencia } from "@/components/frequencia/frequencia-form";
import { FrequenciaChart, type DistribuicaoItem } from "@/components/frequencia/frequencia-chart";
import { SITUACAO_FREQUENCIA_VALUES } from "@/lib/validations/frequencia";

export const metadata: Metadata = { title: "Frequência" };

const SITUACAO_LABEL: Record<string, string> = {
  Presente: "Presente",
  Ausente: "Ausente",
  Justificado: "Justificado",
};

export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string; disciplina?: string; data?: string }>;
}) {
  await requirePermission("frequencia.gerenciar");
  const sp = await searchParams;
  const { turma: idTurma, disciplina: idDisciplina, data: dataAula } = sp;

  const [turmas, disciplinas] = await Promise.all([
    prisma.turma.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, curso: { select: { nome: true } } },
    }),
    prisma.disciplina.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const completo = Boolean(idTurma && idDisciplina && dataAula);

  let alunos: AlunoFrequencia[] = [];
  if (completo) {
    const data = new Date(dataAula!);
    const [matriculas, existentes] = await Promise.all([
      prisma.matricula.findMany({
        where: { idTurma, situacao: { in: ["PreMatricula", "Ativa", "Concluida"] } },
        select: { aluno: { select: { id: true, nome: true } } },
        orderBy: { aluno: { nome: "asc" } },
      }),
      prisma.frequencia.findMany({
        where: { idTurma, idDisciplina, dataAula: data },
        select: { idAluno: true, situacao: true, justificativa: true },
      }),
    ]);
    const mapa = new Map(existentes.map((e) => [e.idAluno, e]));
    alunos = matriculas.map((m) => {
      const reg = mapa.get(m.aluno.id);
      return {
        id: m.aluno.id,
        nome: m.aluno.nome,
        situacao: reg?.situacao,
        justificativa: reg?.justificativa,
      };
    });
  }

  // Indicadores agregados (filtrados por turma/disciplina quando selecionadas).
  const whereInd = {
    ...(idTurma ? { idTurma } : {}),
    ...(idDisciplina ? { idDisciplina } : {}),
  };
  const grupos = await prisma.frequencia.groupBy({
    by: ["situacao"],
    where: whereInd,
    _count: { _all: true },
  });
  const contagem = new Map(grupos.map((g) => [g.situacao, g._count._all]));
  const distribuicao: DistribuicaoItem[] = SITUACAO_FREQUENCIA_VALUES.map((s) => ({
    nome: SITUACAO_LABEL[s],
    valor: contagem.get(s) ?? 0,
  }));
  const totalReg = distribuicao.reduce((acc, d) => acc + d.valor, 0);
  const presentes = contagem.get("Presente") ?? 0;
  const mediaFrequencia = totalReg ? (presentes / totalReg) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Frequência"
        descricao="Registre a presença dos alunos por disciplina, turma e data."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-muted-foreground" /> Selecionar aula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 sm:grid-cols-4 sm:items-end">
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
            <Field label="Data da aula" htmlFor="data">
              <Input id="data" name="data" type="date" defaultValue={dataAula ?? ""} />
            </Field>
            <Button type="submit">Carregar alunos</Button>
          </form>
        </CardContent>
      </Card>

      {completo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" /> Chamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alunos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : (
              <FrequenciaForm
                idDisciplina={idDisciplina!}
                idTurma={idTurma!}
                dataAula={dataAula!}
                alunos={alunos}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CalendarCheck className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Selecione turma, disciplina e data para registrar a frequência.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores de frequência</CardTitle>
        </CardHeader>
        <CardContent>
          <FrequenciaChart distribuicao={distribuicao} mediaFrequencia={mediaFrequencia} />
        </CardContent>
      </Card>
    </div>
  );
}
