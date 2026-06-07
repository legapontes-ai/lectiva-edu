import { z } from "zod";
import { optStr } from "./helpers";

const optEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.email({ error: "E-mail inválido." }).optional(),
);

export const professorSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome do docente." }),
  situacao: z.enum(["Ativo", "Inativo"]).default("Ativo"),
  email: optEmail,
  cpf: optStr,
  telefone: optStr,
  titulacao: optStr,
  areaAtuacao: optStr,
  lattes: optStr,
  miniCurriculo: optStr,
});

export type ProfessorInput = z.infer<typeof professorSchema>;
