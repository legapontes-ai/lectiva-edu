import type { Permissao } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string; // chave resolvida no Sidebar (componentes não cruzam a fronteira server→client)
  permissao: Permissao;
};

/**
 * Itens do menu do painel. Cada item exige uma permissão; o layout filtra
 * conforme as permissões do usuário (RBAC no servidor).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/painel", label: "Visão geral", icon: "dashboard", permissao: "dashboard.ver" },
  { href: "/painel/cursos", label: "Cursos", icon: "course", permissao: "cursos.ver" },
  { href: "/painel/turmas", label: "Turmas", icon: "class", permissao: "turmas.gerenciar" },
  { href: "/painel/alunos", label: "Alunos", icon: "student", permissao: "alunos.ver" },
  { href: "/painel/professores", label: "Docentes", icon: "teacher", permissao: "professores.ver" },
  { href: "/painel/usuarios", label: "Usuários", icon: "users", permissao: "usuarios.gerenciar" },
  { href: "/painel/auditoria", label: "Auditoria", icon: "audit", permissao: "logs.ver" },
];
