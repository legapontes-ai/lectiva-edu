import { z } from "zod";
import { optStr } from "@/lib/validations/helpers";

/** Status da grade curricular (rótulos pt-BR para selects e badges). */
export const STATUS_GRADE = [
  { value: "EmElaboracao", label: "Em elaboração" },
  { value: "Validada", label: "Validada" },
  { value: "Publicada", label: "Publicada" },
] as const;

export type StatusGradeValue = (typeof STATUS_GRADE)[number]["value"];

/** Período opcional: "" / null viram undefined; inteiro positivo. */
const periodoOpt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive({ error: "Período inválido." }).optional(),
);

export const adicionarDisciplinaSchema = z.object({
  idDisciplina: z.uuid({ error: "Selecione uma disciplina." }),
  periodo: periodoOpt,
  preRequisito: optStr,
});

export type AdicionarDisciplinaInput = z.infer<typeof adicionarDisciplinaSchema>;
