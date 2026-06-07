import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "@/lib/painel/nav";
import { sair } from "@/lib/auth/actions";
import { Sidebar } from "@/components/painel/sidebar";
import { Button } from "@/components/ui/button";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const itens = NAV_ITEMS.filter((i) => can(user.permissoes, i.permissao));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={itens} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{user.perfilNome}</p>
          </div>
          <form action={sair}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" /> Sair
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
