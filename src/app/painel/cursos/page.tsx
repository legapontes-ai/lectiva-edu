import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, BookOpen } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirCurso } from "@/lib/cursos/actions";
import { TIPO_CURSO, MODALIDADE_CURSO, SITUACAO_CURSO, rotulo } from "@/lib/enums";
import { formatarBRL } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Cursos" };

export default async function CursosPage() {
  await requirePermission("cursos.ver");
  const podeGerenciar = await temPermissao("cursos.gerenciar");

  const cursos = await prisma.curso.findMany({
    orderBy: { nome: "asc" },
    include: { coordenador: { select: { nome: true } }, _count: { select: { turmas: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Cursos"
        descricao="Catálogo de cursos da instituição."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/cursos/novo" />}>
              <Plus className="size-4" /> Novo curso
            </Button>
          ) : undefined
        }
      />

      {cursos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum curso cadastrado ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Modalidade</th>
                  <th className="px-4 py-3 font-semibold">CH</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Turmas</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  {podeGerenciar && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cursos.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.coordenador?.nome ?? "Sem coordenador"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rotulo(TIPO_CURSO, c.tipo)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rotulo(MODALIDADE_CURSO, c.modalidade)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.cargaHoraria}h</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.valorInvestimento ? formatarBRL(Number(c.valorInvestimento)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c._count.turmas}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.situacao === "Ativo" ? "success" : c.situacao === "Encerrado" ? "muted" : "info"}>
                        {rotulo(SITUACAO_CURSO, c.situacao)}
                      </Badge>
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/cursos/${c.id}`} />} title="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirCurso.bind(null, c.id)} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
