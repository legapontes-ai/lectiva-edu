import type { Metadata } from "next";
import Link from "next/link";
import { Network, ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { STATUS_GRADE } from "@/lib/grade/schema";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Matriz / Grade curricular" };

function badgeStatus(status: string) {
  return status === "Publicada" ? "success" : status === "Validada" ? "info" : "muted";
}

export default async function GradePage() {
  await requirePermission("grade.gerenciar");

  const cursos = await prisma.curso.findMany({
    orderBy: { nome: "asc" },
    include: { grades: { orderBy: { versao: "desc" } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Matriz / Grade curricular"
        descricao="Gerencie as versões da matriz curricular de cada curso."
      />

      {cursos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Network className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum curso cadastrado ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Versões</th>
                  <th className="px-4 py-3 font-semibold">Versão atual</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">CH total</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cursos.map((c) => {
                  const atual = c.grades[0];
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.cargaHoraria}h previstas</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.grades.length}</td>
                      <td className="px-4 py-3 text-muted-foreground">{atual ? `v${atual.versao}` : "—"}</td>
                      <td className="px-4 py-3">
                        {atual ? (
                          <Badge variant={badgeStatus(atual.status)}>{rotulo(STATUS_GRADE, atual.status)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem grade</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{atual ? `${atual.cargaHorariaTotal}h` : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" render={<Link href={`/painel/grade/${c.id}`} />}>
                            Gerenciar <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
