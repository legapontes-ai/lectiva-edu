import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/painel/page-header";
import { MfaManager } from "@/components/seguranca/mfa-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Segurança (MFA)" };

export default async function SegurancaPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Segurança da conta" descricao={`Conta: ${user.email}`} />
      <Card>
        <CardHeader>
          <CardTitle>Autenticação em duas etapas (MFA)</CardTitle>
        </CardHeader>
        <CardContent>
          <MfaManager />
        </CardContent>
      </Card>
    </div>
  );
}
