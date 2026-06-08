import { z } from "zod";
import { optUuid } from "./helpers";

/** Opções (valor + rótulo pt-BR) do módulo de Mensagens/Solicitações. */
export const TIPO_MENSAGEM = [
  { value: "Mensagem", label: "Mensagem" },
  { value: "Duvida", label: "Dúvida" },
  { value: "Solicitacao", label: "Solicitação" },
  { value: "Requerimento", label: "Requerimento" },
] as const;

export const STATUS_MENSAGEM = [
  { value: "Aberta", label: "Aberta" },
  { value: "EmAndamento", label: "Em andamento" },
  { value: "Respondida", label: "Respondida" },
  { value: "Encerrada", label: "Encerrada" },
] as const;

export const mensagemSchema = z.object({
  tipo: z.enum(["Mensagem", "Duvida", "Solicitacao", "Requerimento"]).default("Mensagem"),
  assunto: z.string().trim().max(200).optional(),
  conteudo: z.string().trim().min(3, { error: "Escreva sua mensagem." }),
  idDisciplina: optUuid,
});
export type MensagemInput = z.infer<typeof mensagemSchema>;

export const respostaSchema = z.object({
  resposta: z.string().trim().min(1, { error: "Escreva a resposta." }),
});
export type RespostaInput = z.infer<typeof respostaSchema>;
