"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarRange,
  UserCog,
  ScrollText,
  ShieldCheck,
  Lock,
  BookText,
  Network,
  Library,
  CalendarDays,
  Megaphone,
  CalendarCheck,
  ClipboardList,
  Wallet,
  Award,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import type { NavItem } from "@/lib/painel/nav";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: UserCog,
  course: BookOpen,
  class: CalendarRange,
  student: Users,
  teacher: GraduationCap,
  audit: ScrollText,
  lgpd: ShieldCheck,
  security: Lock,
  disciplina: BookText,
  grade: Network,
  library: Library,
  calendar: CalendarDays,
  comunicados: Megaphone,
  frequency: CalendarCheck,
  assessment: ClipboardList,
  finance: Wallet,
  certificate: Award,
  report: BarChart3,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="bg-sidebar-brand hidden w-64 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-4">
        <Link href="/painel" className="block rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Logo size="sm" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = pathname === item.href || (item.href !== "/painel" && pathname.startsWith(item.href + "/"));
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
