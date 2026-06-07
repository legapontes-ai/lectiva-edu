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
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/painel" className="[&_*]:!text-sidebar-foreground">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
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
