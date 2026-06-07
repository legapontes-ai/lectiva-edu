import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  LogOut,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  Award,
} from "lucide-react";
import type { SituacaoMatricula } from "@prisma/client";
import { requireUser } from "@/lib/auth/dal";
import { sair } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Área do Aluno" };

const SITUACAO_MATRICULA = [
  { value: "PreMatricula", label: "Pré-matrícula" },
  { value: "Ativa", label: "Ativa" },
  { value: "Trancada", label: "Trancada" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Concluida", label: "Concluída" },
] as const;

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const VARIANTE_SITUACAO: Record<SituacaoMatricula, BadgeVariant> = {
  PreMatricula: "warning",
  Ativa: "success",
  Trancada: "muted",
  Cancelada: "danger",
  Concluida: "info",
};

const EM_BREVE = [
  {
    titulo: "Materiais",
    descricao: "Apostilas, slides e referências das suas disciplinas.",
    icone: BookOpen,
  },
  {
    titulo: "Calendário",
    descricao: "Aulas, prazos e eventos das suas turmas.",
    icone: CalendarDays,
  },
  {
    titulo: "Frequência e Notas",
    descricao: "Acompanhe presenças e o seu desempenho acadêmico.",
    icone: ClipboardCheck,
  },
  {
    titulo: "Financeiro",
    descricao: "Mensalidades, boletos e situação de pagamentos.",
    icone: Wallet,
  },
  {
    titulo: "Certificados",
    descricao: "Emissão e download dos seus certificados.",
    icone: Award,
  },
] as const;

export default async function AreaAlunoPage() {
  const user = await requireUser();
  if (user.vinculo !== "Aluno") redirect("/painel");

  const aluno = await prisma.aluno.findUnique({
    where: { idUsuario: user.id },
    include: {
      matriculas: {
        include: { curso: true, turma: true },
        orderBy: { dataMatricula: "desc" },
      },
    },
  });

  const dados = [
    { rotulo: "Nome", valor: aluno?.nome ?? user.nome },
    { rotulo: "E-mail", valor: aluno?.email ?? user.email },
    { rotulo: "CPF", valor: aluno?.cpf ?? "—" },
    { rotulo: "Telefone", valor: aluno?.telefone ?? "—" },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" /> Sair
          </Button>
        </form>
      </div>

      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-primary">
          Olá, {(aluno?.nome ?? user.nome).split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo(a) à sua Área do Aluno do Lectiva Edu.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>Seus dados básicos de cadastro.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {dados.map((d) => (
              <div key={d.rotulo} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{d.rotulo}</dt>
                <dd className="text-sm text-foreground">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Meus cursos e turmas
        </h2>
        {!aluno || aluno.matriculas.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <GraduationCap className="size-5 shrink-0" />
              <p className="text-sm">Você ainda não possui matrículas registradas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {aluno.matriculas.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle>{m.curso.nome}</CardTitle>
                      <CardDescription>
                        Turma: {m.turma?.nome ?? "A definir"}
                      </CardDescription>
                    </div>
                    <Badge variant={VARIANTE_SITUACAO[m.situacao]}>
                      {rotulo(SITUACAO_MATRICULA, m.situacao)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Protocolo: <span className="text-foreground">{m.protocolo}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Em breve</h2>
        <p className="text-sm text-muted-foreground">
          Novos recursos chegam nas próximas fases do Lectiva Edu.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EM_BREVE.map((item) => {
            const Icone = item.icone;
            return (
              <Card key={item.titulo} className="bg-muted/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icone className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                    <Badge variant="muted">Em breve</Badge>
                  </div>
                  <CardDescription>{item.descricao}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
