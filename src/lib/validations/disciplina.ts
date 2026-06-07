import { z } from "zod";
import { optStr, optUuid, reqIntPos } from "./helpers";

export const disciplinaSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome da disciplina." }),
  codigo: optStr,
  ementa: optStr,
  objetivos: optStr,
  conteudoProgramatico: optStr,
  cargaHoraria: reqIntPos,
  idProfessor: optUuid,
  idModulo: optUuid,
  atividadesAvaliativas: optStr,
  datasImportantes: optStr,
  status: z.enum(["Programada", "EmAndamento", "Concluida"]).default("Programada"),
});

export type DisciplinaInput = z.infer<typeof disciplinaSchema>;
