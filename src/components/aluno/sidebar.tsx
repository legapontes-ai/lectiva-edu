"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookText,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  Wallet,
  Award,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

type Item = { href: string; label: string; icon: LucideIcon };

const ITENS: Item[] = [
  { href: "/aluno", label: "Visão geral", icon: LayoutDashboard },
  { href: "/aluno/disciplinas", label: "Minhas disciplinas", icon: BookText },
  { href: "/aluno/frequencia", label: "Frequência", icon: CalendarCheck },
  { href: "/aluno/notas", label: "Notas", icon: ClipboardList },
  { href: "/aluno/comunicacoes", label: "Comunicações", icon: Megaphone },
  { href: "/aluno/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/aluno/certificados", label: "Certificados", icon: Award },
];

export function AlunoSidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-sidebar-brand hidden w-64 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-4">
        <Link href="/aluno" className="block rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Logo size="sm" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {ITENS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/aluno" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-sidebar-foreground/80 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
