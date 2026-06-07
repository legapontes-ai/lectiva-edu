import type { Metadata } from "next";
import { Users, BookOpen, CalendarRange, GraduationCap, Megaphone, ScrollText } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Visão geral" };

export default async function PainelHome() {
  const user = await requirePermission("dashboard.ver");

  const [alunos, alunosAtivos, cursos, turmasAndamento, professores, comunicados] = await Promise.all([
    prisma.aluno.count(),
    prisma.aluno.count({ where: { situacaoAcademica: "Ativo" } }),
    prisma.curso.count(),
    prisma.turma.count({ where: { situacao: "EmAndamento" } }),
    prisma.professor.count({ where: { situacao: "Ativo" } }),
    prisma.comunicado.count({ where: { situacao: "Publicado" } }),
  ]);

  const kpis = [
    { label: "Alunos (ativos / total)", valor: `${alunosAtivos} / ${alunos}`, icon: Users },
    { label: "Cursos", valor: cursos, icon: BookOpen },
    { label: "Turmas em andamento", valor: turmasAndamento, icon: CalendarRange },
    { label: "Docentes ativos", valor: professores, icon: GraduationCap },
    { label: "Comunicados publicados", valor: comunicados, icon: Megaphone },
  ];

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
