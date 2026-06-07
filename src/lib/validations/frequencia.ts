import { z } from "zod";
import { optStr } from "./helpers";

/** Valores dos ENUMs usados no módulo de frequência (espelham o Prisma). */
export const SITUACAO_FREQUENCIA_VALUES = ["Presente", "Ausente", "Justificado"] as const;
export const TIPO_ENCONTRO_VALUES = ["Presencial", "Online"] as const;

export type SituacaoFrequenciaValue = (typeof SITUACAO_FREQUENCIA_VALUES)[number];

export const frequenciaRegistroSchema = z.object({
  idAluno: z.uuid(),
  situacao: z.enum(SITUACAO_FREQUENCIA_VALUES).default("Presente"),
  justificativa: optStr,
});

export const frequenciaEmLoteSchema = z.object({
  idDisciplina: z.uuid({ error: "Selecione a disciplina." }),
  idTurma: z.uuid({ error: "Selecione a turma." }),
  dataAula: z.string().min(1, { error: "Informe a data da aula." }),
  tipoEncontro: z.enum(TIPO_ENCONTRO_VALUES).default("Presencial"),
  registros: z.array(frequenciaRegistroSchema).min(1, { error: "Nenhum aluno na turma." }),
});

export type FrequenciaEmLoteInput = z.infer<typeof frequenciaEmLoteSchema>;
