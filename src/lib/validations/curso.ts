import { z } from "zod";
import { optStr, optNum, optUuid, reqIntPos } from "./helpers";

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
});

export type CursoInput = z.infer<typeof cursoSchema>;
