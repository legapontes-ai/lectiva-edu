import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso negado" };

export default async function AcessoNegadoPage({
  searchParams,
}: {
  searchParams: Promise<{ permissao?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </span>
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Acesso negado</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Seu perfil não tem permissão para acessar este recurso
          {sp.permissao ? ` (${sp.permissao})` : ""}. Se precisar de acesso, fale com a administração.
        </p>
      </div>
      <Button variant="outline" render={<Link href="/painel" />}>
        <ArrowLeft className="size-4" /> Voltar ao painel
      </Button>
    </div>
  );
}
