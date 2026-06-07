import { z } from "zod";
import { optStr } from "./helpers";

const base = {
  nome: z.string().trim().min(3, { error: "Informe o nome do aluno." }),
  cpf: optStr,
  rg: optStr,
  dataNascimento: optStr,
  telefone: optStr,
  endereco: optStr,
  situacaoAcademica: z.enum(["Ativo", "Concluinte", "Inativo"]).default("Ativo"),
};

export const criarAlunoSchema = z.object({
  ...base,
  email: z.email({ error: "E-mail inválido." }).trim().toLowerCase(),
  senha: z
    .string()
    .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Inclua ao menos uma letra." })
    .regex(/[0-9]/, { error: "Inclua ao menos um número." }),
});
export type CriarAlunoInput = z.infer<typeof criarAlunoSchema>;

export const editarAlunoSchema = z.object(base);
export type EditarAlunoInput = z.infer<typeof editarAlunoSchema>;
