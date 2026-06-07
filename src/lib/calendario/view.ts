import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export const TZ_CALENDARIO = "America/Sao_Paulo";

/** Evento já carregado com relações usadas nas visões do calendário. */
export type EventoView = {
  id: string;
  titulo: string;
  tipo: string;
  modalidade: string;
  dataInicio: Date;
  dataFim: Date | null;
  notificar: boolean;
  turma: { nome: string } | null;
  disciplina: { nome: string } | null;
};

/** Variante de Badge por tipo de evento (apenas tokens de cor). */
export function variantePorTipo(
  tipo: string,
): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  switch (tipo) {
    case "Avaliacao":
    case "Prazo":
      return "warning";
    case "Recesso":
      return "muted";
    case "Encerramento":
      return "danger";
    case "Aula":
    case "Palestra":
      return "info";
    default:
      return "default";
  }
}

/** Chave de dia (yyyy-MM-dd) no fuso de São Paulo. */
export function chaveDia(d: Date | string): string {
  return formatInTimeZone(new Date(d), TZ_CALENDARIO, "yyyy-MM-dd");
}

/** Hora (HH:mm) no fuso de São Paulo. */
export function horaSP(d: Date | string): string {
  return formatInTimeZone(new Date(d), TZ_CALENDARIO, "HH:mm", { locale: ptBR });
}

/** Nomes dos meses em pt-BR (1 = Janeiro). */
export const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;
