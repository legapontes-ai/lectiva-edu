import { z } from "zod";
import { optStr, optNum, optUuid, reqIntPos } from "./helpers";

/** Opções (valor + rótulo) da fonte da nota para certificação. */
export const ORIGEM_NOTA = [
  { value: "Avaliacao", label: "Avaliação oficial" },
  { value: "PlanoDeAula", label: "Notas do plano de aula" },
] as const;

/** Booleano vindo de <select> (string "true"/"false"). */
const boolDeSelect = z.preprocess(
  (v) => (v === "true" || v === true ? true : v === "false" || v === false ? false : v),
  z.boolean(),
);

export const cursoSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome do curso." }),
  tipo: z.enum(["MBA", "PosLatoSensu", "Capacitacao", "Extensao", "Livre"]),
  modalidade: z.enum(["Presencial", "Hibrida", "Online", "EAD"]),
  situacao: z.enum(["Ativo", "EmFormacaoDeTurma", "Encerrado"]).default("Ativo"),
  cargaHoraria: reqIntPos,
  duracaoMeses: optNum,
  valorInvestimento: optNum,
  areaConhecimento: optStr,
  formaPagamento: optStr,
  objetivos: optStr,
  metodologia: optStr,
  requisitosConclusao: optStr,
  idCoordenador: optUuid,
  // Regras de aprovação/certificação parametrizadas pelo administrador.
  notaMinimaAprovacao: z.coerce.number().min(0).max(10).default(7),
  frequenciaMinima: z.coerce.number().int().min(0).max(100).default(75),
  origemNota: z.enum(["Avaliacao", "PlanoDeAula"]).default("Avaliacao"),
  exigeTodasDisciplinas: boolDeSelect.default(true),
});

export type CursoInput = z.infer<typeof cursoSchema>;
