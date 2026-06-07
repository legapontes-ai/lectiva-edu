import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { DisciplinaForm } from "@/components/disciplinas/disciplina-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar disciplina" };

export default async function EditarDisciplinaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("disciplinas.gerenciar");
  const { id } = await params;

  const [disciplina, professores, modulosRaw] = await Promise.all([
    prisma.disciplina.findUnique({ where: { id } }),
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
  if (!disciplina) notFound();

  const modulos = modulosRaw.map((m) => ({ id: m.id, nome: m.nome, cursoNome: m.curso.nome }));

  const valores = {
    id: disciplina.id,
    nome: disciplina.nome,
    codigo: disciplina.codigo ?? "",
    ementa: disciplina.ementa ?? "",
    objetivos: disciplina.objetivos ?? "",
    conteudoProgramatico: disciplina.conteudoProgramatico ?? "",
    cargaHoraria: disciplina.cargaHoraria,
    idProfessor: disciplina.idProfessor ?? "",
    idModulo: disciplina.idModulo ?? "",
    atividadesAvaliativas: disciplina.atividadesAvaliativas ?? "",
    datasImportantes: disciplina.datasImportantes ?? "",
    status: disciplina.status,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar disciplina" descricao={disciplina.nome} />
      <Card>
        <CardContent className="pt-6">
          <DisciplinaForm disciplina={valores} professores={professores} modulos={modulos} />
        </CardContent>
      </Card>
    </div>
  );
}
