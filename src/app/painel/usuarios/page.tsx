import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirUsuario } from "@/lib/usuarios/actions";
import { SITUACAO_USUARIO, rotulo } from "@/lib/enums";
import { formatarDataHora } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  await requirePermission("usuarios.gerenciar");

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: "asc" },
    include: { perfil: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Usuários"
        descricao="Contas de acesso e perfis (RBAC)."
        acao={
          <Button render={<Link href="/painel/usuarios/novo" />}>
            <Plus className="size-4" /> Novo usuário
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Perfil</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 font-semibold">Último acesso</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.nome}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.perfil.nome}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.situacao === "Ativo" ? "success" : u.situacao === "Bloqueado" ? "danger" : "muted"}>
                      {rotulo(SITUACAO_USUARIO, u.situacao)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" render={<Link href={`/painel/usuarios/${u.id}`} />} title="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton
                        action={excluirUsuario.bind(null, u.id)}
                        label="Inativar"
                        confirmacao="Inativar este usuário? O acesso é bloqueado, mas a conta e o histórico são preservados. É possível reativar depois."
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
