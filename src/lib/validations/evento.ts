import { z } from "zod";
import { optStr, optUuid } from "./helpers";

/** Opções (valor + rótulo pt-BR) dos ENUMs de Evento, para selects e badges. */
export const TIPO_EVENTO = [
  { value: "Aula", label: "Aula" },
  { value: "Avaliacao", label: "Avaliação" },
  { value: "Encontro", label: "Encontro" },
  { value: "Palestra", label: "Palestra" },
  { value: "Recesso", label: "Recesso" },
  { value: "Prazo", label: "Prazo" },
  { value: "Encerramento", label: "Encerramento" },
] as const;

export const MODALIDADE_EVENTO = [
  { value: "Presencial", label: "Presencial" },
  { value: "Online", label: "Online" },
] as const;

export const eventoSchema = z
  .object({
    titulo: z.string().trim().min(3, { error: "Informe o título do evento." }),
    tipo: z.enum([
      "Aula",
      "Avaliacao",
      "Encontro",
      "Palestra",
      "Recesso",
      "Prazo",
      "Encerramento",
    ]),
    modalidade: z.enum(["Presencial", "Online"]).default("Presencial"),
    dataInicio: z.string().trim().min(1, { error: "Informe a data e hora de início." }),
    dataFim: optStr,
    idTurma: optUuid,
    idDisciplina: optUuid,
    descricao: optStr,
    notificar: z.coerce.boolean().default(false),
  })
  .refine(
    (d) => !d.dataFim || new Date(d.dataFim) >= new Date(d.dataInicio),
    { error: "A data de término deve ser igual ou posterior à de início.", path: ["dataFim"] },
  );

export type EventoInput = z.infer<typeof eventoSchema>;
