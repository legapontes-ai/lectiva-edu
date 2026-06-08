import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { requireUser, exigirSenhaDefinitiva } from "@/lib/auth/dal";
import { sair } from "@/lib/auth/actions";
import { AlunoSidebar } from "@/components/aluno/sidebar";
import { Button } from "@/components/ui/button";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  exigirSenhaDefinitiva(user);
  if (user.vinculo !== "Aluno") redirect("/painel");

  const iniciais = user.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <AlunoSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
          <p className="font-heading text-sm font-semibold text-foreground md:hidden">
            Área do Aluno
          </p>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="truncate text-sm font-semibold text-foreground">{user.nome}</p>
              <p className="truncate text-xs text-muted-foreground">Aluno(a)</p>
            </div>
            <span
              className="bg-brand-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              aria-hidden
            >
              {iniciais}
            </span>
            <form action={sair}>
              <Button type="submit" variant="ghost" size="icon-sm" title="Sair" aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
