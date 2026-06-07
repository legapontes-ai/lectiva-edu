import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, GraduationCap } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirProfessor } from "@/lib/professores/actions";
import { SITUACAO_PROFESSOR, rotulo } from "@/lib/enums";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Docentes" };

export default async function ProfessoresPage() {
  await requirePermission("professores.ver");
  const podeGerenciar = await temPermissao("professores.gerenciar");

  const professores = await prisma.professor.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { disciplinas: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Corpo docente"
        descricao="Professores e suas titulações."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/professores/novo" />}>
              <Plus className="size-4" /> Novo docente
            </Button>
          ) : undefined
        }
      />

      {professores.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum docente cadastrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Titulação</th>
                  <th className="px-4 py-3 font-semibold">Área</th>
                  <th className="px-4 py-3 font-semibold">Disciplinas</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  {podeGerenciar && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {professores.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">{p.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.titulacao ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.areaAtuacao ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p._count.disciplinas}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.situacao === "Ativo" ? "success" : "muted"}>
                        {rotulo(SITUACAO_PROFESSOR, p.situacao)}
                      </Badge>
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/professores/${p.id}`} />} title="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirProfessor.bind(null, p.id)} />
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
