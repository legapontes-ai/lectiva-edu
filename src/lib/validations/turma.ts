import { z } from "zod";
import { optStr, optUuid } from "./helpers";

export const turmaSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome da turma." }),
  idCurso: z.uuid({ error: "Selecione o curso." }),
  anoPeriodo: z.string().trim().min(1, { error: "Informe o ano/período (ex.: 2026.1)." }),
  situacao: z.enum(["EmFormacao", "EmAndamento", "Concluida"]).default("EmFormacao"),
  dataInicio: optStr,
  dataTermino: optStr,
  idCoordenador: optUuid,
});

export type TurmaInput = z.infer<typeof turmaSchema>;
