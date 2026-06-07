import { LogOut, Search } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "@/lib/painel/nav";
import { sair } from "@/lib/auth/actions";
import { Sidebar } from "@/components/painel/sidebar";
import { Button } from "@/components/ui/button";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const itens = NAV_ITEMS.filter((i) => can(user.permissoes, i.permissao));
  const iniciais = user.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={itens} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
          <label className="relative hidden flex-1 sm:block" aria-label="Buscar">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar…"
              className="h-10 w-full max-w-md rounded-full border border-input bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </label>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="truncate text-sm font-semibold text-foreground">{user.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{user.perfilNome}</p>
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
