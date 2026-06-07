"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/cursos", label: "Cursos" },
  { href: "/corpo-docente", label: "Corpo Docente" },
  { href: "/validar-certificado", label: "Validar certificado" },
] as const;

export function SiteHeader() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Página inicial do Lectiva Edu" className="shrink-0">
          <Logo />
        </Link>

        {/* Navegação desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button className="hidden md:inline-flex" render={<Link href="/login" />}>
            Entrar
          </Button>

          {/* Botão do menu mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="menu-mobile"
        className={cn(
          "border-t border-border bg-background md:hidden",
          aberto ? "block" : "hidden"
        )}
      >
        <nav aria-label="Navegação principal" className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Button className="mt-2 w-full" render={<Link href="/login" />} onClick={() => setAberto(false)}>
            Entrar
          </Button>
        </nav>
      </div>
    </header>
  );
}
