import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, CalendarRange } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirTurma } from "@/lib/turmas/actions";
import { SITUACAO_TURMA, rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Turmas" };

export default async function TurmasPage() {
  await requirePermission("turmas.gerenciar");

  const turmas = await prisma.turma.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      curso: { select: { nome: true } },
      coordenador: { select: { nome: true } },
      _count: { select: { matriculas: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Turmas"
        descricao="Turmas vinculadas aos cursos."
        acao={
          <Button render={<Link href="/painel/turmas/nova" />}>
            <Plus className="size-4" /> Nova turma
          </Button>
        }
      />

      {turmas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CalendarRange className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma turma cadastrada.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Turma</th>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Período</th>
                  <th className="px-4 py-3 font-semibold">Início</th>
                  <th className="px-4 py-3 font-semibold">Alunos</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {turmas.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.curso.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.anoPeriodo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.dataInicio ? formatarData(t.dataInicio) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t._count.matriculas}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.situacao === "EmAndamento" ? "success" : t.situacao === "Concluida" ? "muted" : "info"}>
                        {rotulo(SITUACAO_TURMA, t.situacao)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/turmas/${t.id}`} />} title="Editar">
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteButton action={excluirTurma.bind(null, t.id)} />
                      </div>
                    </td>
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
