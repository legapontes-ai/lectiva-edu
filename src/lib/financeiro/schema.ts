import { z } from "zod";
import { optStr } from "@/lib/validations/helpers";
import { FORMA_PAGAMENTO_VALUES } from "./constants";

/** Dados para criação de um plano de pagamento a partir de uma matrícula. */
export const planoSchema = z.object({
  idMatricula: z.uuid({ error: "Selecione a matrícula." }),
  valorTotal: z.coerce.number().positive({ error: "Informe o valor total." }),
  numParcelas: z.coerce
    .number()
    .int()
    .min(1, { error: "Mínimo de 1 parcela." })
    .max(120, { error: "Máximo de 120 parcelas." }),
  descontos: z.coerce.number().min(0).default(0),
  diaVencimento: z.coerce.number().int().min(1).max(28).default(10),
});

export type PlanoInput = z.infer<typeof planoSchema>;

/** Subconjunto enviado pelo formulário (idMatricula vem por bind/route). */
export const planoFormSchema = planoSchema.omit({ idMatricula: true });
export type PlanoFormInput = z.infer<typeof planoFormSchema>;

/** Dados para dar baixa em uma parcela. */
export const baixaSchema = z.object({
  forma: z.enum(FORMA_PAGAMENTO_VALUES, { error: "Selecione a forma de pagamento." }),
  comprovante: optStr,
});

export type BaixaInput = z.infer<typeof baixaSchema>;
