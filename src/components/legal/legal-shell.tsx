import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function LegalShell({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" render={<Link href="/" />}>
            <ArrowLeft className="size-4" /> Início
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-bold text-primary">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: {atualizadoEm}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </main>
    </div>
  );
}
