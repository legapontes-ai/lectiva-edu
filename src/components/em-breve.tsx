import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Placeholder institucional para rotas que serão entregues nas próximas fases. */
export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size="lg" showSlogan />
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Construction className="size-7" />
      </span>
      <div className="max-w-md">
        <h1 className="font-heading text-2xl font-bold text-primary">{titulo}</h1>
        <p className="mt-2 text-muted-foreground">{descricao}</p>
      </div>
      <Button variant="outline" render={<Link href="/" />}>
        <ArrowLeft className="size-4" /> Voltar ao início
      </Button>
    </main>
  );
}
