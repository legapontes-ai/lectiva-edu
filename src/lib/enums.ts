/** Opções (valor + rótulo pt-BR) dos ENUMs do Prisma, para selects e badges. */

export const TIPO_CURSO = [
  { value: "MBA", label: "MBA" },
  { value: "PosLatoSensu", label: "Pós lato sensu" },
  { value: "Capacitacao", label: "Capacitação" },
  { value: "Extensao", label: "Extensão" },
  { value: "Livre", label: "Curso livre" },
] as const;

export const MODALIDADE_CURSO = [
  { value: "Presencial", label: "Presencial" },
  { value: "Hibrida", label: "Híbrida" },
  { value: "Online", label: "Online" },
  { value: "EAD", label: "EAD" },
] as const;

export const SITUACAO_CURSO = [
  { value: "Ativo", label: "Ativo" },
  { value: "EmFormacaoDeTurma", label: "Em formação de turma" },
  { value: "Encerrado", label: "Encerrado" },
] as const;

export const SITUACAO_TURMA = [
  { value: "EmFormacao", label: "Em formação" },
  { value: "EmAndamento", label: "Em andamento" },
  { value: "Concluida", label: "Concluída" },
] as const;

export const STATUS_DISCIPLINA = [
  { value: "Programada", label: "Programada" },
  { value: "EmAndamento", label: "Em andamento" },
  { value: "Concluida", label: "Concluída" },
] as const;

export const SITUACAO_PROFESSOR = [
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" },
] as const;

export const SITUACAO_ACADEMICA = [
  { value: "Ativo", label: "Ativo" },
  { value: "Concluinte", label: "Concluinte" },
  { value: "Inativo", label: "Inativo" },
] as const;

export const SITUACAO_USUARIO = [
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" },
  { value: "Bloqueado", label: "Bloqueado" },
] as const;

/** Retorna o rótulo de um valor de enum a partir de uma lista de opções. */
export function rotulo(
  lista: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return lista.find((o) => o.value === value)?.label ?? value;
}
