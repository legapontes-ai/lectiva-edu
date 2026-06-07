import { z } from "zod";
import { optUuid } from "./helpers";

/** Opções (valor + rótulo pt-BR) específicas do módulo de Comunicados. */
export const PUBLICO_ALVO = [
  { value: "Todos", label: "Todos" },
  { value: "Turma", label: "Turma específica" },
  { value: "Professores", label: "Professores" },
  { value: "Secretaria", label: "Secretaria" },
  { value: "Coordenacao", label: "Coordenação" },
] as const;

export const URGENCIA = [
  { value: "Normal", label: "Normal" },
  { value: "Urgente", label: "Urgente" },
] as const;

export const SITUACAO_COMUNICADO = [
  { value: "Publicado", label: "Publicado" },
  { value: "Arquivado", label: "Arquivado" },
] as const;

export const comunicadoSchema = z
  .object({
    titulo: z.string().trim().min(3, { error: "Informe o título." }),
    conteudo: z.string().trim().min(3, { error: "Informe o conteúdo." }),
    publicoAlvo: z
      .enum(["Todos", "Turma", "Professores", "Secretaria", "Coordenacao"])
      .default("Todos"),
    idTurma: optUuid,
    urgencia: z.enum(["Normal", "Urgente"]).default("Normal"),
  })
  .refine((d) => d.publicoAlvo !== "Turma" || !!d.idTurma, {
    error: "Selecione a turma de destino.",
    path: ["idTurma"],
  });

export type ComunicadoInput = z.infer<typeof comunicadoSchema>;
