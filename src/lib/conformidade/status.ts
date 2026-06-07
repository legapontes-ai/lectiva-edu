import type { StatusConformidade, StatusPlanoAula } from "@prisma/client";

/** Rótulos pt-BR dos status de conformidade. */
export const STATUS_CONFORMIDADE_OPCOES = [
  { value: "Pendente", label: "Pendente" },
  { value: "Conforme", label: "Conforme" },
  { value: "NaoConforme", label: "Não conforme" },
] as const;

/** Rótulos pt-BR dos status do plano de aula. */
export const STATUS_PLANO_OPCOES = [
  { value: "EmElaboracao", label: "Em elaboração" },
  { value: "EmAndamento", label: "Em andamento" },
  { value: "Concluido", label: "Concluído" },
] as const;

export function rotuloConformidade(status: StatusConformidade): string {
  return STATUS_CONFORMIDADE_OPCOES.find((o) => o.value === status)?.label ?? status;
}

export function rotuloPlano(status: StatusPlanoAula): string {
  return STATUS_PLANO_OPCOES.find((o) => o.value === status)?.label ?? status;
}

/** Variante de Badge por status de conformidade (cores por token). */
export function varianteConformidade(
  status: StatusConformidade,
): "success" | "danger" | "warning" {
  if (status === "Conforme") return "success";
  if (status === "NaoConforme") return "danger";
  return "warning";
}

export type ContagemExecucao = { Integral: number; Parcial: number; NaoDado: number; Pendente: number };

export type SinaisPlano = {
  /** Status efetivo de conformidade (Pendente quando ainda não analisado). */
  statusConformidade: StatusConformidade;
  /** Contagem de aulas por estado de execução (sem métrica percentual). */
  contagem: ContagemExecucao;
  /** Aulas efetivamente dadas (integral + parcial). */
  dadas: number;
  /** Carga horária somada das aulas planejadas. */
  cargaSomada: number;
  /** Carga horária da disciplina (referência). */
  cargaDisciplina: number;
  /** Carga das aulas diverge da carga da disciplina. */
  cargaDivergente: boolean;
  /** Sem análise de conformidade registrada. */
  pendente: boolean;
  /** Sem aulas planejadas ou plano ainda em elaboração. */
  incompleto: boolean;
  /** Carga divergente ou análise "Não conforme". */
  emDesacordo: boolean;
};

/**
 * Deriva os sinais de aderência de um plano a partir de seus dados agregados.
 */
export function calcularSinais(args: {
  statusPlano: StatusPlanoAula;
  conformidade: StatusConformidade | null;
  totalAulas: number;
  contagem: ContagemExecucao;
  cargaSomada: number;
  cargaDisciplina: number;
}): SinaisPlano {
  const statusConformidade = args.conformidade ?? "Pendente";
  const cargaDivergente =
    args.cargaDisciplina > 0 && args.cargaSomada !== args.cargaDisciplina;
  const pendente = args.conformidade === null || args.conformidade === "Pendente";
  const incompleto = args.totalAulas === 0 || args.statusPlano === "EmElaboracao";
  const emDesacordo = cargaDivergente || args.conformidade === "NaoConforme";

  return {
    statusConformidade,
    contagem: args.contagem,
    dadas: args.contagem.Integral + args.contagem.Parcial,
    cargaSomada: args.cargaSomada,
    cargaDisciplina: args.cargaDisciplina,
    cargaDivergente,
    pendente,
    incompleto,
    emDesacordo,
  };
}
