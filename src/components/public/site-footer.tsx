import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:px-6">
        <Logo size="sm" />

        <nav aria-label="Links institucionais" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="/politica-de-privacidade"
            className="text-sm text-muted-foreground transition-colors hover:text-link"
          >
            Política de Privacidade
          </Link>
          <Link
            href="/termos-de-uso"
            className="text-sm text-muted-foreground transition-colors hover:text-link"
          >
            Termos de Uso
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">© {ano} Lectiva Edu</p>
      </div>
    </footer>
  );
}
