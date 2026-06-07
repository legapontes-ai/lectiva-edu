import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Megaphone, Eye } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirComunicado, alternarSituacaoComunicado } from "@/lib/comunicados/actions";
import { rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import {
  PUBLICO_ALVO,
  URGENCIA,
  SITUACAO_COMUNICADO,
} from "@/lib/validations/comunicado";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { SituacaoToggle } from "@/components/comunicados/situacao-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Comunicados" };

export default async function ComunicadosPage() {
  await requirePermission("comunicados.gerenciar");

  const comunicados = await prisma.comunicado.findMany({
    orderBy: { dataPublicacao: "desc" },
    include: {
      turma: { select: { nome: true } },
      _count: { select: { leituras: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Comunicados"
        descricao="Avisos e comunicados para turmas e equipes."
        acao={
          <Button render={<Link href="/painel/comunicados/novo" />}>
            <Plus className="size-4" /> Novo comunicado
          </Button>
        }
      />

      {comunicados.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Megaphone className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum comunicado publicado ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Público-alvo</th>
                  <th className="px-4 py-3 font-semibold">Urgência</th>
                  <th className="px-4 py-3 font-semibold">Publicação</th>
                  <th className="px-4 py-3 font-semibold">Leituras</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comunicados.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.titulo}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.publicoAlvo === "Turma"
                        ? `Turma: ${c.turma?.nome ?? "—"}`
                        : rotulo(PUBLICO_ALVO, c.publicoAlvo)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.urgencia === "Urgente" ? "danger" : "muted"}>
                        {rotulo(URGENCIA, c.urgencia)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatarData(c.dataPublicacao)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-4" /> {c._count.leituras}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.situacao === "Publicado" ? "success" : "muted"}>
                        {rotulo(SITUACAO_COMUNICADO, c.situacao)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <SituacaoToggle
                          action={alternarSituacaoComunicado.bind(null, c.id)}
                          situacao={c.situacao}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          render={<Link href={`/painel/comunicados/${c.id}`} />}
                          title="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteButton action={excluirComunicado.bind(null, c.id)} />
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
