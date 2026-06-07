import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Users } from "lucide-react";
import { requirePermission, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirAluno } from "@/lib/alunos/actions";
import { SITUACAO_ACADEMICA, rotulo } from "@/lib/enums";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Alunos" };

export default async function AlunosPage() {
  await requirePermission("alunos.ver");
  const podeGerenciar = await temPermissao("alunos.gerenciar");

  const alunos = await prisma.aluno.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { matriculas: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Alunos"
        descricao="Cadastro de alunos da instituição."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/alunos/novo" />}>
              <Plus className="size-4" /> Novo aluno
            </Button>
          ) : undefined
        }
      />

      {alunos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum aluno cadastrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">CPF</th>
                  <th className="px-4 py-3 font-semibold">Matrículas</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  {podeGerenciar && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alunos.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.nome}</div>
                      <div className="text-xs text-muted-foreground">{a.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.cpf ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a._count.matriculas}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.situacaoAcademica === "Ativo" ? "success" : a.situacaoAcademica === "Concluinte" ? "info" : "muted"}>
                        {rotulo(SITUACAO_ACADEMICA, a.situacaoAcademica)}
                      </Badge>
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/alunos/${a.id}`} />} title="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirAluno.bind(null, a.id)} />
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
