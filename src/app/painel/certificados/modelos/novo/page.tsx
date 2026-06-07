import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/painel/page-header";
import { ModeloCertificadoForm } from "@/components/certificados/modelo-certificado-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo modelo de certificado" };

export default async function NovoModeloPage() {
  await requirePermission("certificados.gerenciar");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Novo modelo"
        descricao="Cadastre um novo modelo de certificado."
      />
      <Card>
        <CardContent className="pt-6">
          <ModeloCertificadoForm />
        </CardContent>
      </Card>
    </div>
  );
}
