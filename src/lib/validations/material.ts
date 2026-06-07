import { z } from "zod";
import { optStr, optUuid } from "./helpers";

/** Bibliografia opcional: "" vira undefined. */
const optBibliografia = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.enum(["Basica", "Complementar"]).optional(),
);

export const materialSchema = z.object({
  titulo: z.string().trim().min(3, { error: "Informe o título do material." }),
  tipo: z.enum(["Livro", "Artigo", "Apostila", "Video", "Link"]),
  autor: optStr,
  categoria: optStr,
  idDisciplina: optUuid,
  arquivoUrl: optStr,
  bibliografia: optBibliografia,
  nivelAcesso: z.enum(["Publico", "Restrito"]).default("Restrito"),
});

export type MaterialInput = z.infer<typeof materialSchema>;

/** Opções (valor + rótulo pt-BR) dos ENUMs deste módulo, para selects e badges. */
export const TIPO_MATERIAL = [
  { value: "Livro", label: "Livro" },
  { value: "Artigo", label: "Artigo" },
  { value: "Apostila", label: "Apostila" },
  { value: "Video", label: "Vídeo" },
  { value: "Link", label: "Link" },
] as const;

export const BIBLIOGRAFIA = [
  { value: "Basica", label: "Básica" },
  { value: "Complementar", label: "Complementar" },
] as const;

export const NIVEL_ACESSO = [
  { value: "Publico", label: "Público" },
  { value: "Restrito", label: "Restrito" },
] as const;

/** Tipos cujo conteúdo é uma URL externa (não arquivo enviado ao Storage). */
export function tipoUsaUrl(tipo: string): boolean {
  return tipo === "Link" || tipo === "Video";
}
