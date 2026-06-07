import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { DisciplinaForm } from "@/components/disciplinas/disciplina-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nova disciplina" };

export default async function NovaDisciplinaPage() {
  await requirePermission("disciplinas.gerenciar");

  const [professores, modulosRaw] = await Promise.all([
    prisma.professor.findMany({
      where: { situacao: "Ativo" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.moduloEixo.findMany({
      select: { id: true, nome: true, curso: { select: { nome: true } } },
      orderBy: [{ curso: { nome: "asc" } }, { ordem: "asc" }],
    }),
  ]);
  const modulos = modulosRaw.map((m) => ({ id: m.id, nome: m.nome, cursoNome: m.curso.nome }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova disciplina" descricao="Cadastre uma nova disciplina." />
      <Card>
        <CardContent className="pt-6">
          <DisciplinaForm professores={professores} modulos={modulos} />
        </CardContent>
      </Card>
    </div>
  );
}
