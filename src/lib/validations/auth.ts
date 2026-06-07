import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase(),
  senha: z.string().min(1, { error: "Informe a senha." }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const solicitarResetSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase(),
});
export type SolicitarResetInput = z.infer<typeof solicitarResetSchema>;

export const novaSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { error: "Inclua ao menos uma letra." })
      .regex(/[0-9]/, { error: "Inclua ao menos um número." }),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, {
    error: "As senhas não coincidem.",
    path: ["confirmar"],
  });
export type NovaSenhaInput = z.infer<typeof novaSenhaSchema>;
