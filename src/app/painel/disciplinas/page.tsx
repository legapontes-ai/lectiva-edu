import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, GraduationCap } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirDisciplina } from "@/lib/disciplinas/actions";
import { rotulo } from "@/lib/enums";
import { STATUS_DISCIPLINA } from "@/components/disciplinas/disciplina-form";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Disciplinas" };

export default async function DisciplinasPage() {
  await requirePermission("disciplinas.ver");
  const podeGerenciar = await temPermissao("disciplinas.gerenciar");

  const disciplinas = await prisma.disciplina.findMany({
    orderBy: { nome: "asc" },
    include: { professor: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Disciplinas"
        descricao="Catálogo de disciplinas da instituição."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/disciplinas/novo" />}>
              <Plus className="size-4" /> Nova disciplina
            </Button>
          ) : undefined
        }
      />

      {disciplinas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma disciplina cadastrada ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Professor</th>
                  <th className="px-4 py-3 font-semibold">CH</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {podeGerenciar && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disciplinas.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{d.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.codigo ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.professor?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.cargaHoraria}h</td>
                    <td className="px-4 py-3">
                      <Badge variant={d.status === "Concluida" ? "muted" : d.status === "EmAndamento" ? "success" : "info"}>
                        {rotulo(STATUS_DISCIPLINA, d.status)}
                      </Badge>
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/disciplinas/${d.id}`} />} title="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirDisciplina.bind(null, d.id)} />
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
