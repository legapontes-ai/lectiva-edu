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
  { href: "/painel/relatorios", label: "Relatórios", icon: "report", permissao: "relatorios.ver" },
  // Estrutura acadêmica
  { href: "/painel/cursos", label: "Cursos", icon: "course", permissao: "cursos.ver" },
  { href: "/painel/turmas", label: "Turmas", icon: "class", permissao: "turmas.gerenciar" },
  { href: "/painel/disciplinas", label: "Disciplinas", icon: "disciplina", permissao: "disciplinas.ver" },
  { href: "/painel/grade", label: "Matriz curricular", icon: "grade", permissao: "grade.gerenciar" },
  // Conteúdo e comunicação
  { href: "/painel/biblioteca", label: "Biblioteca", icon: "library", permissao: "materiais.ver" },
  { href: "/painel/calendario", label: "Calendário", icon: "calendar", permissao: "calendario.gerenciar" },
  { href: "/painel/comunicados", label: "Comunicados", icon: "comunicados", permissao: "comunicados.gerenciar" },
  // Avaliação
  { href: "/painel/frequencia", label: "Frequência", icon: "frequency", permissao: "frequencia.gerenciar" },
  { href: "/painel/avaliacao", label: "Avaliação", icon: "assessment", permissao: "avaliacao.ver" },
  // Financeiro e certificação
  { href: "/painel/financeiro", label: "Financeiro", icon: "finance", permissao: "financeiro.ver" },
  { href: "/painel/certificados", label: "Certificados", icon: "certificate", permissao: "certificados.gerenciar" },
  // Pessoas
  { href: "/painel/alunos", label: "Alunos", icon: "student", permissao: "alunos.ver" },
  { href: "/painel/professores", label: "Docentes", icon: "teacher", permissao: "professores.ver" },
  // Administração e segurança
  { href: "/painel/usuarios", label: "Usuários", icon: "users", permissao: "usuarios.gerenciar" },
  { href: "/painel/autocadastros", label: "Autocadastros", icon: "signup", permissao: "autocadastro.gerenciar" },
  { href: "/painel/parametros", label: "Parâmetros", icon: "params", permissao: "parametros.gerenciar" },
  { href: "/painel/consentimentos", label: "Consentimentos", icon: "lgpd", permissao: "lgpd.gerenciar" },
  { href: "/painel/auditoria", label: "Auditoria", icon: "audit", permissao: "logs.ver" },
  { href: "/painel/seguranca", label: "Segurança (MFA)", icon: "security", permissao: "dashboard.ver" },
];
