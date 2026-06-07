import { z } from "zod";
import { optStr } from "./helpers";

export const STATUS_CONFORMIDADE = ["Pendente", "Conforme", "NaoConforme"] as const;

export const analiseSchema = z.object({
  idPlano: z.uuid({ error: "Plano inválido." }),
  status: z.enum(STATUS_CONFORMIDADE),
  observacoes: optStr,
});

export type AnaliseInput = z.infer<typeof analiseSchema>;
