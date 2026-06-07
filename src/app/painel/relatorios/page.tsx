import type { Metadata } from "next";
import {
  Users,
  GraduationCap,
  BookOpen,
  Library,
  Megaphone,
  CalendarRange,
  Award,
  Percent,
  Activity,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "@/lib/format";
import { SITUACAO_ACADEMICA } from "@/lib/enums";
import { PageHeader } from "@/components/painel/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AlunosSituacaoChart } from "@/components/relatorios/alunos-situacao-chart";
import { CertificadosTipoChart } from "@/components/relatorios/certificados-tipo-chart";
import { InadimplenciaChart } from "@/components/relatorios/inadimplencia-chart";

export const metadata: Metadata = { title: "Relatórios" };

const TIPO_CERTIFICADO_LABEL: Record<string, string> = {
  Conclusao: "Conclusão",
  Modulo: "Módulo",
  Disciplina: "Disciplina",
  Evento: "Evento",
  Participacao: "Participação",
};

const TIPO_MATERIAL_LABEL: Record<string, string> = {
  Livro: "Livro",
  Artigo: "Artigo",
  Apostila: "Apostila",
  Video: "Vídeo",
  Link: "Link",
};

/** Soma o _count de um agrupamento prisma (groupBy com _count: true). */
function somaCount(grupos: { _count: number }[]): number {
  return grupos.reduce((s, g) => s + g._count, 0);
}

function Secao({
  Icon,
  titulo,
  descricao,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-link" />
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">{titulo}</h2>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Numero({ rotulo: label, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted p-4 text-center">
      <span className="text-2xl font-bold text-primary">{valor}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const thClass =
  "px-4 py-3 font-semibold";
const theadClass =
  "border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground";

export default async function RelatoriosPage() {
  await requirePermission("relatorios.ver");

  const agora = new Date();

  const [
    turmas,
    alunosPorSituacao,
    profPorSituacao,
    docentesTop,
    modulos,
    materiaisPorTipo,
    comunicadosPorSituacao,
    eventosProximos,
    eventosPassados,
    certificadosPorTipo,
    matriculasConcluidas,
    certificadosChave,
    freqAvg,
    planosPorSituacao,
    ultimosLogins,
    logsPorAcao,
  ] = await Promise.all([
    // Alunos por turma (matrículas por turma, com curso)
    prisma.turma.findMany({
      orderBy: [{ anoPeriodo: "desc" }, { nome: "asc" }],
      select: {
        id: true,
        nome: true,
        anoPeriodo: true,
        curso: { select: { nome: true } },
        _count: { select: { matriculas: true } },
      },
    }),
    // Alunos por situação acadêmica
    prisma.aluno.groupBy({ by: ["situacaoAcademica"], _count: true }),
    // Docentes ativos / inativos
    prisma.professor.groupBy({ by: ["situacao"], _count: true }),
    // Top docentes por nº de disciplinas
    prisma.professor.findMany({
      select: {
        id: true,
        nome: true,
        situacao: true,
        _count: { select: { disciplinas: true } },
      },
    }),
    // Disciplinas por módulo / eixo
    prisma.moduloEixo.findMany({
      orderBy: [{ idCurso: "asc" }, { ordem: "asc" }],
      select: {
        id: true,
        nome: true,
        curso: { select: { nome: true } },
        _count: { select: { disciplinas: true } },
      },
    }),
    // Materiais por tipo (biblioteca)
    prisma.materialBiblioteca.groupBy({ by: ["tipo"], _count: true }),
    // Comunicados por situação
    prisma.comunicado.groupBy({ by: ["situacao"], _count: true }),
    // Eventos próximos / passados
    prisma.evento.count({ where: { dataInicio: { gte: agora } } }),
    prisma.evento.count({ where: { dataInicio: { lt: agora } } }),
    // Certificados emitidos por tipo
    prisma.certificado.groupBy({
      by: ["tipo"],
      where: { situacao: { not: "Cancelado" } },
      _count: true,
    }),
    // Matrículas concluídas (para pendências de certificação)
    prisma.matricula.findMany({
      where: { situacao: "Concluida" },
      select: { idAluno: true, idCurso: true },
    }),
    // Certificados existentes (aluno + curso) para cruzar pendências
    prisma.certificado.findMany({
      where: { situacao: { not: "Cancelado" } },
      select: { idAluno: true, idCurso: true },
    }),
    // Frequência média geral
    prisma.frequencia.aggregate({ _avg: { percentualAcumulado: true } }),
    // Planos por situação (inadimplência)
    prisma.planoPagamento.groupBy({ by: ["situacao"], _count: true }),
    // Últimos logins
    prisma.usuario.findMany({
      where: { ultimoAcesso: { not: null } },
      orderBy: { ultimoAcesso: "desc" },
      take: 8,
      select: { id: true, nome: true, perfil: { select: { nome: true } }, ultimoAcesso: true },
    }),
    // Auditoria: contagem por ação (top)
    prisma.logAuditoria.groupBy({
      by: ["acao"],
      _count: { acao: true },
      orderBy: { _count: { acao: "desc" } },
      take: 8,
    }),
  ]);

  // ---- Pós-processamento ----
  const totalAlunos = somaCount(alunosPorSituacao);
  const situacaoAlunoChart = SITUACAO_ACADEMICA.map((o) => ({
    nome: o.label,
    valor: alunosPorSituacao.find((g) => g.situacaoAcademica === o.value)?._count ?? 0,
  }));

  const docentesAtivos = profPorSituacao.find((g) => g.situacao === "Ativo")?._count ?? 0;
  const docentesInativos = profPorSituacao.find((g) => g.situacao === "Inativo")?._count ?? 0;
  const docentesRanking = [...docentesTop]
    .filter((d) => d._count.disciplinas > 0)
    .sort((a, b) => b._count.disciplinas - a._count.disciplinas)
    .slice(0, 8);

  const certificadosChart = certificadosPorTipo
    .map((g) => ({ nome: TIPO_CERTIFICADO_LABEL[g.tipo] ?? g.tipo, valor: g._count }))
    .sort((a, b) => b.valor - a.valor);
  const totalCertificados = certificadosPorTipo.reduce((s, g) => s + g._count, 0);

  // Pendências: matrículas Concluídas sem certificado do mesmo aluno+curso
  const chavesCert = new Set(certificadosChave.map((c) => `${c.idAluno}:${c.idCurso}`));
  const chavesConcluidas = new Set(matriculasConcluidas.map((m) => `${m.idAluno}:${m.idCurso}`));
  const pendenciasCertificacao = [...chavesConcluidas].filter((k) => !chavesCert.has(k)).length;

  const planosChart = [
    { nome: "Adimplente", valor: planosPorSituacao.find((g) => g.situacao === "Adimplente")?._count ?? 0 },
    { nome: "Inadimplente", valor: planosPorSituacao.find((g) => g.situacao === "Inadimplente")?._count ?? 0 },
  ];

  const freqMedia = freqAvg._avg.percentualAcumulado
    ? Number(freqAvg._avg.percentualAcumulado)
    : null;

  const totalMatriculasEmTurmas = turmas.reduce((s, t) => s + t._count.matriculas, 0);

  return (
    <div className="space-y-10">
      <PageHeader
        titulo="Relatórios"
        descricao="Indicadores agregados de alunos, docentes, conteúdo, certificação, frequência e acessos."
      />

      {/* Alunos */}
      <Secao Icon={Users} titulo="Alunos" descricao="Distribuição por situação e por turma.">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Situação acadêmica ({totalAlunos} aluno(s))
              </p>
              <AlunosSituacaoChart distribuicao={situacaoAlunoChart} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alunos por turma
              </p>
              <span className="text-xs text-muted-foreground">
                {totalMatriculasEmTurmas} matrícula(s)
              </span>
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className={theadClass}>
                  <tr>
                    <th className={thClass}>Turma</th>
                    <th className={thClass}>Curso</th>
                    <th className={`${thClass} text-right`}>Alunos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {turmas.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>
                        Nenhuma turma cadastrada.
                      </td>
                    </tr>
                  ) : (
                    turmas.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {t.nome}
                          <span className="ml-1 text-xs text-muted-foreground">({t.anoPeriodo})</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{t.curso.nome}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {t._count.matriculas}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Secao>

      {/* Docentes */}
      <Secao Icon={GraduationCap} titulo="Docentes" descricao="Quadro docente e carga de disciplinas.">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <Numero rotulo="Docentes ativos" valor={docentesAtivos} />
            <Numero rotulo="Docentes inativos" valor={docentesInativos} />
          </div>

          <Card className="overflow-hidden lg:col-span-2">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Disciplinas por docente (top)
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Docente</th>
                  <th className={`${thClass} text-right`}>Disciplinas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docentesRanking.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>
                      Nenhum docente com disciplinas vinculadas.
                    </td>
                  </tr>
                ) : (
                  docentesRanking.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{d.nome}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {d._count.disciplinas}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </Secao>

      {/* Conteúdo acadêmico */}
      <Secao
        Icon={BookOpen}
        titulo="Conteúdo acadêmico"
        descricao="Disciplinas por módulo/eixo e acervo da biblioteca."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Disciplinas por módulo / eixo
              </p>
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className={theadClass}>
                  <tr>
                    <th className={thClass}>Módulo / eixo</th>
                    <th className={thClass}>Curso</th>
                    <th className={`${thClass} text-right`}>Disciplinas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modulos.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>
                        Nenhum módulo cadastrado.
                      </td>
                    </tr>
                  ) : (
                    modulos.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{m.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.curso.nome}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {m._count.disciplinas}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Library className="size-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Materiais por tipo (biblioteca)
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Tipo</th>
                  <th className={`${thClass} text-right`}>Materiais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {materiaisPorTipo.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>
                      Nenhum material cadastrado.
                    </td>
                  </tr>
                ) : (
                  [...materiaisPorTipo]
                    .sort((a, b) => b._count - a._count)
                    .map((m) => (
                      <tr key={m.tipo} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {TIPO_MATERIAL_LABEL[m.tipo] ?? m.tipo}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {m._count}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </Secao>

      {/* Comunicação e calendário */}
      <Secao
        Icon={Megaphone}
        titulo="Comunicação e calendário"
        descricao="Comunicados e eventos da instituição."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Numero
            rotulo="Comunicados publicados"
            valor={comunicadosPorSituacao.find((g) => g.situacao === "Publicado")?._count ?? 0}
          />
          <Numero
            rotulo="Comunicados arquivados"
            valor={comunicadosPorSituacao.find((g) => g.situacao === "Arquivado")?._count ?? 0}
          />
          <Numero rotulo="Eventos próximos" valor={eventosProximos} />
          <Numero rotulo="Eventos passados" valor={eventosPassados} />
        </div>
      </Secao>

      {/* Certificação */}
      <Secao
        Icon={Award}
        titulo="Certificação"
        descricao="Certificados emitidos por tipo e pendências de emissão."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Certificados por tipo ({totalCertificados} emitido(s))
              </p>
              <CertificadosTipoChart distribuicao={certificadosChart} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Numero rotulo="Total de certificados emitidos" valor={totalCertificados} />
            <div className="flex flex-col gap-1 rounded-lg bg-muted p-4 text-center">
              <span className="text-2xl font-bold text-destructive">{pendenciasCertificacao}</span>
              <span className="text-xs text-muted-foreground">
                Pendências de certificação (matrículas concluídas sem certificado)
              </span>
            </div>
          </div>
        </div>
      </Secao>

      {/* Frequência e financeiro */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao Icon={Percent} titulo="Frequência" descricao="Média geral de presença.">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 p-10 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Frequência média geral
              </span>
              <span className="text-5xl font-bold text-primary">
                {freqMedia === null
                  ? "—"
                  : `${freqMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
              </span>
              <span className="text-xs text-muted-foreground">
                Média do percentual acumulado registrado
              </span>
            </CardContent>
          </Card>
        </Secao>

        <Secao Icon={CalendarRange} titulo="Financeiro" descricao="Planos por situação.">
          <Card>
            <CardContent className="p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Adimplência dos planos
              </p>
              <InadimplenciaChart distribuicao={planosChart} />
            </CardContent>
          </Card>
        </Secao>
      </div>

      {/* Acessos / auditoria */}
      <Secao
        Icon={Activity}
        titulo="Acessos e auditoria"
        descricao="Últimos logins e ações registradas na trilha de auditoria."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Últimos logins
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Usuário</th>
                  <th className={thClass}>Perfil</th>
                  <th className={`${thClass} text-right`}>Último acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ultimosLogins.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>
                      Nenhum acesso registrado.
                    </td>
                  </tr>
                ) : (
                  ultimosLogins.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.perfil.nome}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações de auditoria (top)
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Ação</th>
                  <th className={`${thClass} text-right`}>Ocorrências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logsPorAcao.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>
                      Nenhum registro de auditoria.
                    </td>
                  </tr>
                ) : (
                  logsPorAcao.map((l) => (
                    <tr key={l.acao} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{l.acao}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {l._count.acao}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </Secao>
    </div>
  );
}
