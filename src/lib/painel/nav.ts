import { can, type Permissao } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string; // chave resolvida no Sidebar (componentes não cruzam a fronteira server→client)
  permissao: Permissao;
};

/** Subseção opcional dentro de um módulo (cabeçalho leve agrupando itens). */
export type NavSubsection = {
  label?: string;
  items: NavItem[];
};

/** Módulo do painel — um bloco colapsável na barra lateral. */
export type NavGroup = {
  id: string;
  label: string;
  icon: string; // chave do ícone do módulo (resolvida no Sidebar)
  /** Quando true, renderiza como link único fixo (sem cabeçalho colapsável). Ex.: Início. */
  pinned?: boolean;
  subsections: NavSubsection[];
};

/**
 * Módulos do painel (arquitetura de informação v3 — Fase 1).
 * Cada item exige uma permissão; o layout filtra conforme as permissões do
 * usuário (RBAC no servidor) e esconde subseções/módulos que ficarem vazios.
 *
 * Fase 2 (não incluída aqui): separação real de Comunicados (geral × curso) e
 * Relatórios (institucional × curso/matéria × pessoal) e o canal multi-área do
 * aluno. Ver docs/proposta-reorganizacao-modulos.md.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "inicio",
    label: "Início",
    icon: "dashboard",
    pinned: true,
    subsections: [
      { items: [{ href: "/painel", label: "Visão geral", icon: "dashboard", permissao: "dashboard.ver" }] },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    icon: "cadastros",
    subsections: [
      {
        items: [
          { href: "/painel/cursos", label: "Cursos", icon: "course", permissao: "cursos.ver" },
          { href: "/painel/disciplinas", label: "Disciplinas", icon: "disciplina", permissao: "disciplinas.ver" },
          { href: "/painel/grade", label: "Matriz curricular", icon: "grade", permissao: "grade.gerenciar" },
          { href: "/painel/turmas", label: "Turmas", icon: "class", permissao: "turmas.gerenciar" },
          { href: "/painel/professores", label: "Docentes", icon: "teacher", permissao: "professores.ver" },
        ],
      },
    ],
  },
  {
    id: "academico",
    label: "Acadêmico",
    icon: "academico",
    subsections: [
      {
        items: [
          { href: "/painel/planos", label: "Planos de aula", icon: "lesson", permissao: "planos.ver" },
          { href: "/painel/frequencia", label: "Frequência", icon: "frequency", permissao: "frequencia.gerenciar" },
          { href: "/painel/avaliacao", label: "Avaliação", icon: "assessment", permissao: "avaliacao.ver" },
          { href: "/painel/biblioteca", label: "Biblioteca", icon: "library", permissao: "materiais.ver" },
          { href: "/painel/calendario", label: "Calendário", icon: "calendar", permissao: "calendario.gerenciar" },
        ],
      },
    ],
  },
  {
    id: "coordenacao",
    label: "Coordenação",
    icon: "coordenacao",
    subsections: [
      {
        items: [
          { href: "/painel/conformidade", label: "Conformidade", icon: "compliance", permissao: "planos.conformidade" },
        ],
      },
    ],
  },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: "secretaria",
    subsections: [
      {
        label: "Pessoas & Ingresso",
        items: [
          { href: "/painel/alunos", label: "Alunos", icon: "student", permissao: "alunos.ver" },
          { href: "/painel/autocadastros", label: "Autocadastros", icon: "signup", permissao: "autocadastro.gerenciar" },
        ],
      },
      {
        label: "Financeiro & Documentos",
        items: [
          { href: "/painel/financeiro", label: "Financeiro", icon: "finance", permissao: "financeiro.ver" },
          { href: "/painel/certificados", label: "Certificados", icon: "certificate", permissao: "certificados.gerenciar" },
        ],
      },
      {
        label: "Comunicação & Relatórios",
        items: [
          { href: "/painel/comunicados", label: "Comunicados", icon: "comunicados", permissao: "comunicados.gerenciar" },
          { href: "/painel/mensagens", label: "Mensagens", icon: "messages", permissao: "mensagens.responder" },
          { href: "/painel/relatorios", label: "Relatórios", icon: "report", permissao: "relatorios.ver" },
        ],
      },
    ],
  },
  {
    id: "config",
    label: "Configurações",
    icon: "config",
    subsections: [
      {
        items: [
          { href: "/painel/usuarios", label: "Usuários", icon: "users", permissao: "usuarios.gerenciar" },
          { href: "/painel/parametros", label: "Parâmetros", icon: "params", permissao: "parametros.gerenciar" },
          { href: "/painel/consentimentos", label: "Consentimentos", icon: "lgpd", permissao: "lgpd.gerenciar" },
          { href: "/painel/auditoria", label: "Auditoria", icon: "audit", permissao: "logs.ver" },
          { href: "/painel/seguranca", label: "Segurança (MFA)", icon: "security", permissao: "dashboard.ver" },
        ],
      },
    ],
  },
];

/**
 * Filtra os módulos pelas permissões do usuário: remove itens sem acesso,
 * subseções que ficarem vazias e módulos que ficarem sem nenhuma subseção.
 */
export function filtrarGruposPorPermissao(permissoes: Set<string>): NavGroup[] {
  return NAV_GROUPS.map((grupo) => ({
    ...grupo,
    subsections: grupo.subsections
      .map((sub) => ({ ...sub, items: sub.items.filter((item) => can(permissoes, item.permissao)) }))
      .filter((sub) => sub.items.length > 0),
  })).filter((grupo) => grupo.subsections.length > 0);
}
