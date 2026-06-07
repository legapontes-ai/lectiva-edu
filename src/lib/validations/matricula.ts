import { z } from "zod";
import { optStr, optNum } from "./helpers";

/** Senha do acesso do aluno: mín. 8 caracteres, com letra e número. */
export const senhaMatriculaSchema = z
  .string()
  .min(8, { error: "A senha deve ter ao menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "Inclua ao menos uma letra." })
  .regex(/[0-9]/, { error: "Inclua ao menos um número." });

/** Documento anexado já enviado ao Storage. */
export const documentoAnexoSchema = z.object({
  nome: z.string(),
  path: z.string(),
});
export type DocumentoAnexo = z.infer<typeof documentoAnexoSchema>;

// ----------------------------------------------------------------------------
// Etapa 1 — Dados pessoais
// ----------------------------------------------------------------------------
export const dadosPessoaisSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome completo." }),
  email: z.email({ error: "E-mail inválido." }).trim().toLowerCase(),
  cpf: z.string().trim().min(11, { error: "Informe o CPF." }),
  rg: optStr,
  dataNascimento: z.string().trim().min(1, { error: "Informe a data de nascimento." }),
  telefone: z.string().trim().min(8, { error: "Informe um telefone para contato." }),
  endereco: z.string().trim().min(3, { error: "Informe o endereço." }),
  filiacao: optStr,
  nacionalidade: optStr,
  estadoCivil: optStr,
  senha: senhaMatriculaSchema,
});
export type DadosPessoaisInput = z.infer<typeof dadosPessoaisSchema>;

// ----------------------------------------------------------------------------
// Etapa 2 — Formação anterior + documentos
// ----------------------------------------------------------------------------
export const formacaoSchema = z.object({
  formacaoGraduacao: optStr,
  instituicaoAnterior: optStr,
  anoConclusao: optNum,
  numeroDiploma: optStr,
  documentosAnexos: z.array(documentoAnexoSchema).optional(),
});
export type FormacaoInput = z.infer<typeof formacaoSchema>;

// ----------------------------------------------------------------------------
// Etapa 3 — Aceite de contrato + consentimento LGPD
// ----------------------------------------------------------------------------
export const aceiteSchema = z.object({
  contratoAceito: z
    .boolean()
    .refine((v) => v === true, { error: "É necessário aceitar o contrato de prestação de serviços." }),
  consentimentoLGPD: z
    .boolean()
    .refine((v) => v === true, { error: "É necessário consentir com o tratamento de dados pessoais." }),
});
export type AceiteInput = z.infer<typeof aceiteSchema>;

// ----------------------------------------------------------------------------
// Schema completo (validação final no servidor)
// ----------------------------------------------------------------------------
export const matriculaSchema = z.object({
  ...dadosPessoaisSchema.shape,
  ...formacaoSchema.shape,
  ...aceiteSchema.shape,
});
export type MatriculaInput = z.infer<typeof matriculaSchema>;

/** Campos de cada etapa do formulário, para validação parcial (RHF trigger). */
export const camposPorEtapa = {
  1: ["nome", "email", "cpf", "rg", "dataNascimento", "telefone", "endereco", "filiacao", "nacionalidade", "estadoCivil", "senha"],
  2: ["formacaoGraduacao", "instituicaoAnterior", "anoConclusao", "numeroDiploma"],
  3: ["contratoAceito", "consentimentoLGPD"],
} as const satisfies Record<number, readonly (keyof MatriculaInput)[]>;
