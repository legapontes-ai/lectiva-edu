import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { NovoUsuarioForm } from "@/components/usuarios/novo-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo usuário" };

export default async function NovoUsuarioPage() {
  await requirePermission("usuarios.gerenciar");
  const perfis = await prisma.perfil.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Novo usuário" descricao="Cria a conta de acesso e o perfil." />
      <Card>
        <CardContent className="pt-6">
          <NovoUsuarioForm perfis={perfis} />
        </CardContent>
      </Card>
    </div>
  );
}
