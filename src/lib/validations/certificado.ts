import { z } from "zod";
import { optStr } from "./helpers";

/** Opções (valor + rótulo pt-BR) dos ENUMs de certificados — módulo Certificação. */
export const TIPO_CERTIFICADO = [
  { value: "Conclusao", label: "Conclusão" },
  { value: "Modulo", label: "Módulo" },
  { value: "Disciplina", label: "Disciplina" },
  { value: "Evento", label: "Evento" },
  { value: "Participacao", label: "Participação" },
] as const;

export const SITUACAO_MODELO_CERTIFICADO = [
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" },
] as const;

export const SITUACAO_CERTIFICADO = [
  { value: "Emitido", label: "Emitido" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Reemitido", label: "Reemitido" },
] as const;

export const modeloCertificadoSchema = z.object({
  nome: z.string().trim().min(3, { error: "Informe o nome do modelo." }),
  tipo: z.enum(["Conclusao", "Modulo", "Disciplina", "Evento", "Participacao"]),
  layout: optStr,
  textoPadrao: optStr,
  requisitos: optStr,
  situacao: z.enum(["Ativo", "Inativo"]).default("Ativo"),
});

export type ModeloCertificadoInput = z.infer<typeof modeloCertificadoSchema>;

/** Validação dos identificadores para emissão de certificado. */
export const emitirCertificadoSchema = z.object({
  idAluno: z.uuid({ error: "Selecione o aluno." }),
  idCurso: z.uuid({ error: "Selecione o curso." }),
  idModelo: z.uuid({ error: "Selecione o modelo." }),
});

export type EmitirCertificadoInput = z.infer<typeof emitirCertificadoSchema>;
