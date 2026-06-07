import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { Users, BookOpen, CalendarRange, GraduationCap, Megaphone, ScrollText } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MatriculasMesChart } from "@/components/dashboard/matriculas-mes-chart";
import { SituacaoAcademicaChart } from "@/components/dashboard/situacao-academica-chart";
import { FinanceiroChart } from "@/components/dashboard/financeiro-chart";

export const metadata: Metadata = { title: "Visão geral" };

const TZ = "America/Sao_Paulo";
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function PainelHome() {
  const user = await requirePermission("dashboard.ver");

  // Janela dos últimos 6 meses (a partir do mês corrente em America/Sao_Paulo).
  const inicioJanela = new Date();
  inicioJanela.setMonth(inicioJanela.getMonth() - 6);

  const [
    alunos,
    alunosAtivos,
    cursos,
    turmasAndamento,
    professores,
    comunicados,
    matriculasRecentes,
    porSituacaoAcademica,
    porSituacaoParcela,
    planosTotal,
    planosAdimplentes,
  ] = await Promise.all([
    prisma.aluno.count(),
    prisma.aluno.count({ where: { situacaoAcademica: "Ativo" } }),
    prisma.curso.count(),
    prisma.turma.count({ where: { situacao: "EmAndamento" } }),
    prisma.professor.count({ where: { situacao: "Ativo" } }),
    prisma.comunicado.count({ where: { situacao: "Publicado" } }),
    prisma.matricula.findMany({
      where: { dataMatricula: { gte: inicioJanela } },
      select: { dataMatricula: true },
    }),
    prisma.aluno.groupBy({ by: ["situacaoAcademica"], _count: { _all: true } }),
    prisma.parcela.groupBy({ by: ["situacao"], _count: { _all: true } }),
    prisma.planoPagamento.count(),
    prisma.planoPagamento.count({ where: { situacao: "Adimplente" } }),
  ]);

  const kpis = [
    { label: "Alunos (ativos / total)", valor: `${alunosAtivos} / ${alunos}`, icon: Users },
    { label: "Cursos", valor: cursos, icon: BookOpen },
    { label: "Turmas em andamento", valor: turmasAndamento, icon: CalendarRange },
    { label: "Docentes ativos", valor: professores, icon: GraduationCap },
    { label: "Comunicados publicados", valor: comunicados, icon: Megaphone },
  ];

  // Matrículas por mês: monta 6 buckets ordenados e distribui os registros.
  const anoAtual = Number(formatInTimeZone(new Date(), TZ, "yyyy"));
  const mesAtual = Number(formatInTimeZone(new Date(), TZ, "MM"));
  const buckets: { chave: string; nome: string; valor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let ano = anoAtual;
    let mes = mesAtual - i;
    while (mes <= 0) {
      mes += 12;
      ano -= 1;
    }
    buckets.push({
      chave: `${ano}-${String(mes).padStart(2, "0")}`,
      nome: MESES_ABREV[mes - 1],
      valor: 0,
    });
  }
  for (const m of matriculasRecentes) {
    const chave = formatInTimeZone(m.dataMatricula, TZ, "yyyy-MM");
    const bucket = buckets.find((b) => b.chave === chave);
    if (bucket) bucket.valor += 1;
  }
  const matriculasPorMes = buckets.map((b) => ({ nome: b.nome, valor: b.valor }));

  // Distribuição de alunos por situação acadêmica.
  const situacaoAcademica = porSituacaoAcademica.map((g) => ({
    nome: g.situacaoAcademica,
    valor: g._count._all,
  }));

  // Parcelas por situação, em ordem fixa e com rótulos pt-BR.
  const ROTULO_PARCELA: Record<string, string> = {
    Paga: "Pagas",
    EmAberto: "Em aberto",
    Vencida: "Vencidas",
  };
  const contagemParcela = new Map(porSituacaoParcela.map((g) => [g.situacao, g._count._all]));
  const parcelas = (["Paga", "EmAberto", "Vencida"] as const).map((s) => ({
    nome: ROTULO_PARCELA[s],
    valor: contagemParcela.get(s) ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Olá, {user.nome.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma Lectiva Edu.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <k.icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{k.valor}</p>
                <p className="truncate text-sm text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Matrículas por mês</CardTitle>
            <CardDescription>Novas matrículas nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <MatriculasMesChart dados={matriculasPorMes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alunos por situação acadêmica</CardTitle>
            <CardDescription>Distribuição do quadro discente.</CardDescription>
          </CardHeader>
          <CardContent>
            <SituacaoAcademicaChart distribuicao={situacaoAcademica} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Situação financeira</CardTitle>
          <CardDescription>Parcelas por situação e adimplência dos planos de pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <FinanceiroChart
            parcelas={parcelas}
            planosAdimplentes={planosAdimplentes}
            planosTotal={planosTotal}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <ScrollText className="mt-0.5 size-5 shrink-0 text-link" />
          <p>
            Os módulos de cadastro (usuários, cursos, turmas, alunos e docentes) e os demais painéis
            são liberados conforme as fases do projeto. Seu perfil <strong>{user.perfilNome}</strong> define
            o que aparece no menu lateral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
