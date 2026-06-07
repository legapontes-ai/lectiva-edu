import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, CalendarDays, UserRound } from "lucide-react";
import { requirePermission, requireUser, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import { STATUS_PLANO_VALUES, EXECUCAO_INFO } from "@/lib/validations/plano";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanoTabs } from "@/components/planos/plano-tabs";
import { PlanoDetalhesForm } from "@/components/planos/plano-detalhes-form";
import { AulaForm } from "@/components/planos/aula-form";
import { AulaItem } from "@/components/planos/aula-item";
import { AtividadeForm } from "@/components/planos/atividade-form";
import { NotasGrid } from "@/components/planos/notas-grid";
import { DiarioForm } from "@/components/planos/diario-form";
import { OcorrenciaForm } from "@/components/planos/ocorrencia-form";

export const metadata: Metadata = { title: "Plano de aula" };

const STATUS_PLANO = STATUS_PLANO_VALUES.map((v) => ({
  value: v,
  label: v === "EmElaboracao" ? "Em elaboração" : v === "EmAndamento" ? "Em andamento" : "Concluído",
}));

function statusVariant(status: string): "info" | "warning" | "success" {
  if (status === "Concluido") return "success";
  if (status === "EmAndamento") return "warning";
  return "info";
}

const MATRICULAS_ATIVAS = ["PreMatricula", "Ativa", "Concluida"] as const;

export default async function PlanoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission("planos.ver");
  const user = await requireUser();
  const podeElaborarPerm = await temPermissao("planos.elaborar");
  const { id } = await params;
  const { aba = "plano" } = await searchParams;

  const plano = await prisma.planoAula.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      objetivos: true,
      metodologia: true,
      idTurma: true,
      idProfessor: true,
      disciplina: { select: { nome: true, ementa: true, objetivos: true, cargaHoraria: true } },
      turma: { select: { nome: true, curso: { select: { nome: true } } } },
      professor: { select: { nome: true, idUsuario: true } },
      aulas: {
        orderBy: { ordem: "asc" },
        select: {
          id: true,
          ordem: true,
          titulo: true,
          conteudo: true,
          objetivos: true,
          dataPrevista: true,
          cargaHoraria: true,
          concluida: true,
          dataConclusao: true,
          execucao: true,
          motivoExecucao: true,
          docenteTipo: true,
          docenteNome: true,
          materiais: { select: { id: true, titulo: true, arquivoUrl: true } },
        },
      },
      atividades: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          peso: true,
          escalaMax: true,
          data: true,
          notas: { select: { idAluno: true, nota: true } },
        },
      },
      diarios: {
        orderBy: { data: "desc" },
        select: {
          id: true,
          data: true,
          conteudoMinistrado: true,
          observacoes: true,
          aula: { select: { titulo: true } },
        },
      },
    },
  });

  if (!plano) notFound();

  // O professor só acessa os próprios planos; coordenação/gestor (planos.ver) acessam em leitura.
  const ehDono = plano.professor.idUsuario === user.id;
  const podeEditar = podeElaborarPerm && ehDono;

  // Alunos da turma (via matrículas ativas).
  const matriculas = await prisma.matricula.findMany({
    where: { idTurma: plano.idTurma, situacao: { in: [...MATRICULAS_ATIVAS] } },
    select: { aluno: { select: { id: true, nome: true } } },
    orderBy: { aluno: { nome: "asc" } },
  });
  const alunos = matriculas.map((m) => ({ id: m.aluno.id, nome: m.aluno.nome }));

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: { idTurma: plano.idTurma },
    orderBy: { data: "desc" },
    select: {
      id: true,
      tipo: true,
      descricao: true,
      data: true,
      aluno: { select: { nome: true } },
      aula: { select: { titulo: true } },
    },
  });

  // Acompanhamento por contagem de estados de execução (sem métrica percentual).
  const totalAulas = plano.aulas.length;
  const chTotal = plano.aulas.reduce((s, a) => s + (a.cargaHoraria ?? 0), 0);
  const cont = { Integral: 0, Parcial: 0, NaoDado: 0, Pendente: 0 };
  for (const a of plano.aulas) {
    const k = (a.execucao in cont ? a.execucao : "Pendente") as keyof typeof cont;
    cont[k]++;
  }
  const contagens = [
    { label: "Integral", n: cont.Integral, variant: "success" as const },
    { label: "Parcial", n: cont.Parcial, variant: "warning" as const },
    { label: "Não dada", n: cont.NaoDado, variant: "danger" as const },
    { label: "Pendentes", n: cont.Pendente, variant: "muted" as const },
  ];

  const aulasOpcoes = plano.aulas.map((a) => ({ id: a.id, titulo: `${a.ordem}. ${a.titulo}` }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" render={<Link href="/painel/planos" />}>
          <ArrowLeft className="size-4" /> Planos de aula
        </Button>
        <PageHeader
          titulo={plano.disciplina.nome}
          descricao={`${plano.turma.nome} · ${plano.turma.curso.nome}`}
          acao={<Badge variant={statusVariant(plano.status)}>{rotulo(STATUS_PLANO, plano.status)}</Badge>}
        />
        {!podeEditar && (
          <p className="text-sm text-muted-foreground">
            Visualização somente leitura{ehDono ? "" : ` — plano de ${plano.professor.nome}`}.
          </p>
        )}
      </div>

      <PlanoTabs id={plano.id} aba={aba} />

      {/* (a) PLANO ------------------------------------------------------------ */}
      {aba === "plano" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {contagens.map((c) => (
                  <div key={c.label} className="rounded-lg border border-border p-3 text-center">
                    <p className="font-heading text-2xl font-bold text-foreground">{c.n}</p>
                    <Badge variant={c.variant} className="mt-1">{c.label}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {totalAulas} aula(s){chTotal > 0 ? ` · ${chTotal}h planejada(s)` : ""}.
              </p>
              <div className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Carga horária da disciplina
                  </p>
                  <p className="mt-1 text-foreground">{plano.disciplina.cargaHoraria}h</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Carga horária planejada (aulas)
                  </p>
                  <p className="mt-1 text-foreground">{chTotal}h</p>
                </div>
              </div>
              {plano.disciplina.ementa && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ementa da disciplina
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{plano.disciplina.ementa}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivos e metodologia</CardTitle>
            </CardHeader>
            <CardContent>
              {podeEditar ? (
                <PlanoDetalhesForm
                  idPlano={plano.id}
                  objetivos={plano.objetivos ?? ""}
                  metodologia={plano.metodologia ?? ""}
                  status={plano.status}
                />
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivos</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{plano.objetivos || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metodologia</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{plano.metodologia || "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* (b) AULAS ------------------------------------------------------------ */}
      {aba === "aulas" && (
        <div className="space-y-6">
          {/* Cronograma consolidado: data + matéria/conteúdo por aula */}
          {plano.aulas.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-muted-foreground" /> Cronograma
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nº</th>
                      <th className="px-4 py-3 font-semibold">Data prevista</th>
                      <th className="px-4 py-3 font-semibold">Aula</th>
                      <th className="px-4 py-3 font-semibold">Matéria / conteúdo</th>
                      <th className="px-4 py-3 font-semibold">CH</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plano.aulas.map((a) => (
                      <tr key={a.id} className="align-top hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{a.ordem}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {a.dataPrevista ? formatarData(a.dataPrevista) : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{a.titulo}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.conteudo
                            ? a.conteudo.length > 90
                              ? a.conteudo.slice(0, 90) + "…"
                              : a.conteudo
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {a.cargaHoraria ? `${a.cargaHoraria}h` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={(EXECUCAO_INFO[a.execucao] ?? EXECUCAO_INFO.Pendente).variant}>
                            {(EXECUCAO_INFO[a.execucao] ?? EXECUCAO_INFO.Pendente).label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {podeEditar && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar aula ao cronograma</CardTitle>
              </CardHeader>
              <CardContent>
                <AulaForm idPlano={plano.id} />
              </CardContent>
            </Card>
          )}

          {plano.aulas.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma aula planejada ainda.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {plano.aulas.map((a) => (
                <AulaItem
                  key={a.id}
                  podeEditar={podeEditar}
                  professorTitular={plano.professor.nome}
                  aula={{
                    id: a.id,
                    ordem: a.ordem,
                    titulo: a.titulo,
                    conteudo: a.conteudo,
                    objetivos: a.objetivos,
                    dataPrevista: a.dataPrevista ? a.dataPrevista.toISOString().slice(0, 10) : null,
                    dataPrevistaLabel: a.dataPrevista ? formatarData(a.dataPrevista) : null,
                    cargaHoraria: a.cargaHoraria,
                    concluida: a.concluida,
                    dataConclusaoLabel: a.dataConclusao ? formatarData(a.dataConclusao) : null,
                    execucao: a.execucao,
                    motivoExecucao: a.motivoExecucao,
                    docenteTipo: a.docenteTipo,
                    docenteNome: a.docenteNome,
                    materiais: a.materiais,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* (c) NOTAS ------------------------------------------------------------ */}
      {aba === "notas" && (
        <div className="space-y-6">
          {podeEditar && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nova atividade avaliativa</CardTitle>
              </CardHeader>
              <CardContent>
                <AtividadeForm idPlano={plano.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-muted-foreground" /> Grade de notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plano.atividades.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Cadastre ao menos uma atividade avaliativa.
                </p>
              ) : alunos.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum aluno matriculado nesta turma.
                </p>
              ) : (
                <NotasGrid
                  key={plano.atividades.map((at) => at.id).join("-")}
                  idPlano={plano.id}
                  podeEditar={podeEditar}
                  alunos={alunos}
                  atividades={plano.atividades.map((at) => ({
                    id: at.id,
                    nome: at.nome,
                    peso: Number(at.peso),
                    escalaMax: Number(at.escalaMax),
                    data: at.data ? formatarData(at.data) : null,
                    notas: at.notas.map((n) => ({
                      idAluno: n.idAluno,
                      nota: n.nota != null ? Number(n.nota) : null,
                    })),
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* (d) DIÁRIO DE CLASSE ------------------------------------------------- */}
      {aba === "diario" && (
        <div className="space-y-6">
          {podeEditar && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lançar no diário de classe</CardTitle>
              </CardHeader>
              <CardContent>
                <DiarioForm idPlano={plano.id} aulas={aulasOpcoes} />
              </CardContent>
            </Card>
          )}

          {plano.diarios.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <CalendarDays className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum registro no diário ainda.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Aula</th>
                      <th className="px-4 py-3 font-semibold">Conteúdo ministrado</th>
                      <th className="px-4 py-3 font-semibold">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plano.diarios.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30 align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatarData(d.data)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.aula?.titulo ?? "—"}</td>
                        <td className="px-4 py-3 text-foreground">{d.conteudoMinistrado || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.observacoes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* (e) OCORRÊNCIAS ----------------------------------------------------- */}
      {aba === "ocorrencias" && (
        <div className="space-y-6">
          {podeEditar && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registrar ocorrência</CardTitle>
              </CardHeader>
              <CardContent>
                {alunos.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Nenhum aluno matriculado nesta turma.
                  </p>
                ) : (
                  <OcorrenciaForm idPlano={plano.id} alunos={alunos} aulas={aulasOpcoes} />
                )}
              </CardContent>
            </Card>
          )}

          {ocorrencias.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <UserRound className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma ocorrência registrada.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Aluno</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                      <th className="px-4 py-3 font-semibold">Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ocorrencias.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/30 align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatarData(o.data)}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{o.aluno.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.tipo || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{o.descricao}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.aula?.titulo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!podeEditar && ocorrencias.length > 0 && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="size-3.5" /> Histórico de ocorrências da turma.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
