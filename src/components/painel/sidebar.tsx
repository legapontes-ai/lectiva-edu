"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarRange,
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
  UserPlus,
  SlidersHorizontal,
  NotebookPen,
  ClipboardCheck,
  Inbox,
  FolderPlus,
  Compass,
  Briefcase,
  Settings,
  ChevronDown,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import type { NavGroup, NavItem } from "@/lib/painel/nav";

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
  messages: Inbox,
  frequency: CalendarCheck,
  assessment: ClipboardList,
  finance: Wallet,
  certificate: Award,
  report: BarChart3,
  signup: UserPlus,
  params: SlidersHorizontal,
  lesson: NotebookPen,
  compliance: ClipboardCheck,
  // ícones de módulo
  cadastros: FolderPlus,
  academico: GraduationCap,
  coordenacao: Compass,
  secretaria: Briefcase,
  config: Settings,
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/painel" && pathname.startsWith(href + "/"));
}

function ItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = ICONS[item.icon] ?? LayoutDashboard;
  const active = isActive(pathname, item.href);
  return (
    <Link
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
}

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  // Módulo que contém a rota atual começa expandido.
  const activeGroupId = groups.find((g) =>
    g.subsections.some((s) => s.items.some((i) => isActive(pathname, i.href))),
  )?.id;
  const [open, setOpen] = useState<Record<string, boolean>>(
    activeGroupId ? { [activeGroupId]: true } : {},
  );

  return (
    <aside className="bg-sidebar-brand hidden w-64 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-4">
        <Link href="/painel" className="block rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Logo size="sm" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {groups.map((group) => {
          // Módulos fixos (Início): link único, sem cabeçalho colapsável.
          if (group.pinned) {
            return group.subsections
              .flatMap((s) => s.items)
              .map((item) => <ItemLink key={item.href} item={item} pathname={pathname} />);
          }

          const GroupIcon = ICONS[group.icon] ?? LayoutDashboard;
          const expanded = open[group.id] ?? false;
          const panelId = `nav-grupo-${group.id}`;
          return (
            <div key={group.id} className="pt-1">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !expanded }))}
                className="flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-sidebar-foreground/60 transition-colors hover:bg-white/8 hover:text-white"
              >
                <GroupIcon className="size-4" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn("size-4 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
                />
              </button>
              {expanded && (
                <div id={panelId} className="mt-1 space-y-1 pl-2">
                  {group.subsections.map((sub, idx) => (
                    <div key={sub.label ?? idx} className="space-y-1">
                      {sub.label && (
                        <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/40">
                          {sub.label}
                        </p>
                      )}
                      {sub.items.map((item) => (
                        <ItemLink key={item.href} item={item} pathname={pathname} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
