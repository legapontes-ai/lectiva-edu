import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome." }),
  email: z.email({ error: "E-mail inválido." }).trim().toLowerCase(),
  senha: z
    .string()
    .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Inclua ao menos uma letra." })
    .regex(/[0-9]/, { error: "Inclua ao menos um número." }),
  idPerfil: z.uuid({ error: "Selecione o perfil." }),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const editarUsuarioSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome." }),
  idPerfil: z.uuid({ error: "Selecione o perfil." }),
  situacao: z.enum(["Ativo", "Inativo", "Bloqueado"]),
});
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
