import { z } from "zod";
import { optStr } from "./helpers";

/** Perfis que podem se autocadastrar (nunca Admin/Gestor). */
export const PERFIS_AUTOCADASTRO = [
  "Aluno",
  "Professor",
  "Coordenação Acadêmica",
  "Secretaria Acadêmica",
] as const;

export const autocadastroSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome completo." }),
  email: z.email({ error: "E-mail inválido." }).trim().toLowerCase(),
  cpf: optStr,
  telefone: optStr,
  idPerfil: z.uuid({ error: "Selecione o perfil." }),
});
export type AutocadastroInput = z.infer<typeof autocadastroSchema>;

export const politicaSenhaSchema = z.object({
  idPerfil: z.uuid(),
  diasValidade: z.coerce.number().int().min(1, { error: "Mínimo 1 dia." }).max(365),
});
export type PoliticaSenhaInput = z.infer<typeof politicaSenhaSchema>;

export const trocarSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { error: "Inclua ao menos uma letra." })
      .regex(/[0-9]/, { error: "Inclua ao menos um número." }),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { error: "As senhas não coincidem.", path: ["confirmar"] });
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;
