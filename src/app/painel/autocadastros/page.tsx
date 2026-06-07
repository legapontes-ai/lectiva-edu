import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { AutocadastroAcoes } from "@/components/autocadastro/autocadastro-acoes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Autocadastros" };

const VARIANTE: Record<string, "warning" | "success" | "danger" | "muted"> = {
  Pendente: "warning",
  Aprovado: "success",
  Rejeitado: "danger",
  Expirado: "muted",
};

export default async function AutocadastrosPage() {
  await requirePermission("autocadastro.gerenciar");
  const itens = await prisma.autocadastro.findMany({
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    take: 200,
    include: { perfil: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Autocadastros"
        descricao="Fila de aprovação dos cadastros solicitados pelos próprios usuários."
      />
      {itens.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <UserPlus className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma solicitação de autocadastro.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Perfil</th>
                  <th className="px-4 py-3 font-semibold">Solicitado em</th>
                  <th className="px-4 py-3 font-semibold">Senha expira</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itens.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.nome}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.perfil.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatarDataHora(a.criadoEm)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {a.senhaExpiraEm ? formatarDataHora(a.senhaExpiraEm) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={VARIANTE[a.status] ?? "muted"}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AutocadastroAcoes id={a.id} status={a.status} />
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
