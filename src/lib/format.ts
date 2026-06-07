import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

const TZ = "America/Sao_Paulo";

export function formatarDataHora(d: Date | string): string {
  return formatInTimeZone(new Date(d), TZ, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatarData(d: Date | string): string {
  return formatInTimeZone(new Date(d), TZ, "dd/MM/yyyy", { locale: ptBR });
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarBRL(valor: number | string): string {
  return brl.format(typeof valor === "string" ? Number(valor) : valor);
}
