import { z } from "zod";
import { optNum, optStr } from "./helpers";

/** Valores dos ENUMs usados no módulo de avaliação (espelham o Prisma). */
export const TIPO_AVALIACAO_VALUES = ["Curso", "Disciplina", "Professor"] as const;
export const FORMA_COLETA_VALUES = ["Identificada", "Anonima"] as const;
export const SITUACAO_AVALIACAO_VALUES = ["Aprovado", "Reprovado", "Recuperacao"] as const;

export type SituacaoAvaliacaoValue = (typeof SITUACAO_AVALIACAO_VALUES)[number];

/** Situação opcional: "" / null viram undefined; valida contra o enum. */
const optSituacao = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.enum(SITUACAO_AVALIACAO_VALUES).optional(),
);

export const avaliacaoRegistroSchema = z.object({
  idAluno: z.uuid(),
  nota: optNum,
  situacao: optSituacao,
  percentualFrequencia: optNum,
});

export const lancarNotasSchema = z.object({
  idDisciplina: z.uuid({ error: "Selecione a disciplina." }),
  idTurma: z.uuid({ error: "Selecione a turma." }),
  tipo: z.enum(TIPO_AVALIACAO_VALUES).default("Disciplina"),
  formaColeta: z.enum(FORMA_COLETA_VALUES).default("Identificada"),
  dataAplicacao: optStr,
  registros: z.array(avaliacaoRegistroSchema).min(1, { error: "Nenhum aluno na turma." }),
});

export type LancarNotasInput = z.infer<typeof lancarNotasSchema>;
