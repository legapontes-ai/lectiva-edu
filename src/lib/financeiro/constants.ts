/**
 * Opções (valor + rótulo pt-BR) dos ENUMs financeiros do Prisma e formas de
 * pagamento aceitas. Mantidas no próprio módulo para selects e badges.
 */

export const SITUACAO_PLANO = [
  { value: "Adimplente", label: "Adimplente" },
  { value: "Inadimplente", label: "Inadimplente" },
] as const;

export const SITUACAO_PARCELA = [
  { value: "Paga", label: "Paga" },
  { value: "EmAberto", label: "Em aberto" },
  { value: "Vencida", label: "Vencida" },
] as const;

export const FORMA_PAGAMENTO = [
  { value: "Pix", label: "Pix" },
  { value: "Boleto", label: "Boleto" },
  { value: "CartaoCredito", label: "Cartão de crédito" },
  { value: "CartaoDebito", label: "Cartão de débito" },
  { value: "Transferencia", label: "Transferência" },
  { value: "Dinheiro", label: "Dinheiro" },
] as const;

export const FORMA_PAGAMENTO_VALUES = FORMA_PAGAMENTO.map((f) => f.value) as [
  string,
  ...string[],
];

/** Variante de badge para cada situação de plano. */
export function variantePlano(s: string): "success" | "danger" {
  return s === "Adimplente" ? "success" : "danger";
}

/** Variante de badge para cada situação de parcela. */
export function varianteParcela(s: string): "success" | "warning" | "danger" {
  if (s === "Paga") return "success";
  if (s === "Vencida") return "danger";
  return "warning";
}
