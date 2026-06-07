import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { sair } from "@/lib/auth/actions";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Área do Aluno" };

export default async function AreaAlunoPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" /> Sair
          </Button>
        </form>
      </div>
      <Card>
        <CardContent className="space-y-3 p-8">
          <h1 className="font-heading text-2xl font-bold text-primary">Olá, {user.nome.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">
            A Área do Aluno completa — disciplinas, materiais, calendário, comunicados, frequência,
            notas, mensagens, financeiro e certificados — chega na <strong>Fase 2 — Ingresso</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Seu login já está ativo e seguro (Supabase Auth + RBAC).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
