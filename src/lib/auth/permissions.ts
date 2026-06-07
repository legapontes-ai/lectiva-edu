/**
 * Catálogo central de permissões e mapeamento por perfil (RBAC).
 * A checagem de permissão acontece SEMPRE no servidor (ver src/lib/auth/rbac.ts).
 *
 * Convenção: "<modulo>.<acao>". O perfil Administrador possui "admin.full",
 * que concede acesso total (curto-circuito em `can()`).
 */

export const PERMISSAO_ADMIN_FULL = "admin.full" as const;

/** Lista canônica de permissões usadas no sistema. */
export const PERMISSOES = [
  PERMISSAO_ADMIN_FULL,
  // Segurança / usuários
  "usuarios.gerenciar",
  "perfis.gerenciar",
  // Acadêmico - estrutura
  "cursos.gerenciar",
  "cursos.ver",
  "turmas.gerenciar",
  "grade.gerenciar",
  "disciplinas.gerenciar",
  "disciplinas.ver",
  // Pessoas
  "alunos.gerenciar",
  "alunos.ver",
  "professores.gerenciar",
  "professores.ver",
  "matriculas.gerenciar",
  // Conteúdo / comunicação
  "biblioteca.gerenciar",
  "materiais.ver",
  "calendario.gerenciar",
  "comunicados.gerenciar",
  // Avaliação
  "frequencia.gerenciar",
  "avaliacao.gerenciar",
  "avaliacao.ver",
  // Certificação
  "certificados.gerenciar",
  "certificados.validar",
  "certificados.baixar",
  // Financeiro
  "financeiro.gerenciar",
  "financeiro.ver",
  // Relatórios / gestão
  "relatorios.ver",
  "dashboard.ver",
  // Atendimento
  "mensagens.responder",
  "mensagens.enviar",
  // Área do aluno
  "area_aluno.acessar",
  // LGPD / logs
  "lgpd.gerenciar",
  "logs.ver",
] as const;

export type Permissao = (typeof PERMISSOES)[number];

/** Nomes canônicos dos 5 perfis. */
export const PERFIS = {
  ADMIN: "Administrador Geral",
  COORDENACAO: "Coordenação Acadêmica",
  PROFESSOR: "Professor",
  SECRETARIA: "Secretaria Acadêmica",
  ALUNO: "Aluno",
} as const;

/** Permissões concedidas a cada perfil no seed inicial. */
export const PERMISSOES_POR_PERFIL: Record<string, Permissao[]> = {
  [PERFIS.ADMIN]: [PERMISSAO_ADMIN_FULL],
  [PERFIS.COORDENACAO]: [
    "cursos.gerenciar",
    "turmas.gerenciar",
    "grade.gerenciar",
    "disciplinas.gerenciar",
    "professores.ver",
    "alunos.ver",
    "calendario.gerenciar",
    "comunicados.gerenciar",
    "frequencia.gerenciar",
    "avaliacao.gerenciar",
    "certificados.validar",
    "relatorios.ver",
    "dashboard.ver",
    "mensagens.responder",
    "logs.ver",
  ],
  [PERFIS.PROFESSOR]: [
    "disciplinas.ver",
    "materiais.ver",
    "biblioteca.gerenciar",
    "frequencia.gerenciar",
    "avaliacao.ver",
    "avaliacao.gerenciar",
    "comunicados.gerenciar",
    "mensagens.responder",
    "dashboard.ver",
  ],
  [PERFIS.SECRETARIA]: [
    "alunos.gerenciar",
    "alunos.ver",
    "matriculas.gerenciar",
    "cursos.ver",
    "turmas.gerenciar",
    "certificados.gerenciar",
    "comunicados.gerenciar",
    "calendario.gerenciar",
    "financeiro.ver",
    "relatorios.ver",
    "dashboard.ver",
    "mensagens.responder",
  ],
  [PERFIS.ALUNO]: [
    "area_aluno.acessar",
    "materiais.ver",
    "disciplinas.ver",
    "certificados.baixar",
    "financeiro.ver",
    "mensagens.enviar",
  ],
};

/** Vínculo padrão associado a cada perfil. */
export const VINCULO_POR_PERFIL: Record<string, "Aluno" | "Professor" | "Coordenacao" | "Secretaria" | "Admin"> = {
  [PERFIS.ADMIN]: "Admin",
  [PERFIS.COORDENACAO]: "Coordenacao",
  [PERFIS.PROFESSOR]: "Professor",
  [PERFIS.SECRETARIA]: "Secretaria",
  [PERFIS.ALUNO]: "Aluno",
};

/**
 * Avalia se um conjunto de permissões concede a permissão exigida.
 * "admin.full" concede tudo.
 */
export function can(permissoesDoUsuario: Iterable<string>, exigida: Permissao): boolean {
  const set = permissoesDoUsuario instanceof Set ? permissoesDoUsuario : new Set(permissoesDoUsuario);
  return set.has(PERMISSAO_ADMIN_FULL) || set.has(exigida);
}
