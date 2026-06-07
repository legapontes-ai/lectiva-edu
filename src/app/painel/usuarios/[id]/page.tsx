import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/painel/page-header";
import { EditarUsuarioForm } from "@/components/usuarios/editar-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("usuarios.gerenciar");
  const { id } = await params;
  const [usuario, perfis] = await Promise.all([
    prisma.usuario.findUnique({ where: { id } }),
    prisma.perfil.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!usuario) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Editar usuário" descricao={usuario.nome} />
      <Card>
        <CardContent className="pt-6">
          <EditarUsuarioForm
            id={usuario.id}
            email={usuario.email}
            perfis={perfis}
            defaultValues={{ nome: usuario.nome, idPerfil: usuario.idPerfil, situacao: usuario.situacao }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
