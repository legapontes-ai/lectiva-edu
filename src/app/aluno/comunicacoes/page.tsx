import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { formatarDataHora } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Comunicações — Área do Aluno" };

export default async function AlunoComunicacoesPage() {
  const { aluno } = await alunoDaSessao();

  const turmaIds = aluno
    ? (
        await prisma.matricula.findMany({
          where: { idAluno: aluno.id, idTurma: { not: null } },
          select: { idTurma: true },
        })
      )
        .map((m) => m.idTurma)
        .filter((id): id is string => !!id)
    : [];

  const comunicados = await prisma.comunicado.findMany({
    where: {
      situacao: "Publicado",
      OR: [{ publicoAlvo: "Todos" }, { publicoAlvo: "Turma", idTurma: { in: turmaIds } }],
    },
    include: { autor: { select: { nome: true } }, turma: { select: { nome: true } } },
    orderBy: { dataPublicacao: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Comunicações" descricao="Avisos e comunicados da instituição." />

      {comunicados.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <Megaphone className="size-5 shrink-0" />
            <p className="text-sm">Nenhum comunicado para você no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {comunicados.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{c.titulo}</CardTitle>
                    <CardDescription>
                      {formatarDataHora(c.dataPublicacao)} · {c.autor.nome}
                      {c.publicoAlvo === "Turma" && c.turma ? ` · Turma ${c.turma.nome}` : ""}
                    </CardDescription>
                  </div>
                  {c.urgencia === "Urgente" ? <Badge variant="danger">Urgente</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">{c.conteudo}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
