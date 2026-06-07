import { z } from "zod";
import { optStr, optNum, optUuid } from "./helpers";

/** Valores do ENUM StatusPlanoAula (espelham o Prisma). */
export const STATUS_PLANO_VALUES = ["EmElaboracao", "EmAndamento", "Concluido"] as const;
export type StatusPlanoValue = (typeof STATUS_PLANO_VALUES)[number];

/** Data obrigatória (string ISO "yyyy-MM-dd" vinda de <input type="date">). */
const reqDateStr = z.string().trim().min(1, { error: "Informe a data." });

/** Plano de aula — vínculo e cabeçalho. */
export const planoSchema = z.object({
  idDisciplina: z.uuid({ error: "Selecione a disciplina." }),
  idTurma: z.uuid({ error: "Selecione a turma." }),
  objetivos: optStr,
  metodologia: optStr,
  status: z.enum(STATUS_PLANO_VALUES).default("EmElaboracao"),
});
export type PlanoInput = z.infer<typeof planoSchema>;

/** Edição apenas do cabeçalho (objetivos/metodologia/status). */
export const planoDetalhesSchema = z.object({
  objetivos: optStr,
  metodologia: optStr,
  status: z.enum(STATUS_PLANO_VALUES).default("EmElaboracao"),
});
export type PlanoDetalhesInput = z.infer<typeof planoDetalhesSchema>;

/** Aula planejada. */
export const aulaSchema = z.object({
  titulo: z.string().trim().min(2, { error: "Informe o título da aula." }),
  conteudo: optStr,
  objetivos: optStr,
  dataPrevista: optStr,
  cargaHoraria: optNum,
  ordem: optNum,
});
export type AulaInput = z.infer<typeof aulaSchema>;

/** Atividade avaliativa. */
export const atividadeSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome da atividade." }),
  peso: z.coerce.number().positive({ error: "Peso deve ser maior que zero." }).default(1),
  escalaMax: z.coerce.number().positive({ error: "Escala deve ser maior que zero." }).default(10),
  data: optStr,
});
export type AtividadeInput = z.infer<typeof atividadeSchema>;

/** Lançamento de uma nota individual. */
export const notaRegistroSchema = z.object({
  idAtividade: z.uuid(),
  idAluno: z.uuid(),
  nota: optNum,
});
export type NotaRegistro = z.infer<typeof notaRegistroSchema>;

export const lancarNotasSchema = z.object({
  registros: z.array(notaRegistroSchema),
});
export type LancarNotasPlanoInput = z.infer<typeof lancarNotasSchema>;

/** Diário de classe (registro por data, opcionalmente vinculado a uma aula). */
export const diarioSchema = z.object({
  data: reqDateStr,
  idAula: optUuid,
  conteudoMinistrado: optStr,
  observacoes: optStr,
});
export type DiarioInput = z.infer<typeof diarioSchema>;

/** Ocorrência por aluno. */
export const ocorrenciaSchema = z.object({
  idAluno: z.uuid({ error: "Selecione o aluno." }),
  tipo: optStr,
  descricao: z.string().trim().min(2, { error: "Descreva a ocorrência." }),
  data: reqDateStr,
  idAula: optUuid,
});
export type OcorrenciaInput = z.infer<typeof ocorrenciaSchema>;

/** Material anexado a uma aula (via URL externa). */
export const materialAulaSchema = z.object({
  titulo: z.string().trim().min(2, { error: "Informe o título do material." }),
  arquivoUrl: optStr,
});
export type MaterialAulaInput = z.infer<typeof materialAulaSchema>;

// ---------------------------------------------------------------------------
// v1.2 — Plano parametrizado + execução por aula
// ---------------------------------------------------------------------------
export const PERIODICIDADE = [
  { value: "Mensal", label: "Mensal" },
  { value: "Bimestral", label: "Bimestral" },
  { value: "Semestral", label: "Semestral" },
  { value: "Anual", label: "Anual" },
] as const;
/** Nº de aulas sugerido por periodicidade (1 por semana). */
export const AULAS_POR_PERIODO: Record<string, number> = { Mensal: 4, Bimestral: 8, Semestral: 20, Anual: 40 };

export const EXECUCAO = [
  { value: "Pendente", label: "Pendente" },
  { value: "Integral", label: "Dado integral" },
  { value: "Parcial", label: "Dado parcial" },
  { value: "NaoDado", label: "Não dado" },
] as const;

/** Rótulo + variante de badge por estado de execução. */
export const EXECUCAO_INFO: Record<string, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  Integral: { label: "Dado integral", variant: "success" },
  Parcial: { label: "Dado parcial", variant: "warning" },
  NaoDado: { label: "Não dado", variant: "danger" },
  Pendente: { label: "Pendente", variant: "muted" },
};

export const TIPO_DOCENTE = [
  { value: "Titular", label: "Titular" },
  { value: "Substituto", label: "Substituto" },
] as const;

export const MOTIVOS_EXECUCAO = [
  "Feriado",
  "Falta do professor",
  "Evento/atividade",
  "Tempo insuficiente",
  "Greve",
  "Outro",
] as const;

const aulaNovaSchema = z.object({
  titulo: z.string().trim().min(2, { error: "Informe o título/matéria da aula." }),
  conteudo: optStr,
  dataPrevista: optStr,
  cargaHoraria: optNum,
});

/** Criação de plano já com as aulas (matérias + datas) e parametrização. */
export const novoPlanoSchema = z.object({
  idDisciplina: z.uuid({ error: "Selecione a disciplina." }),
  idTurma: z.uuid({ error: "Selecione a turma." }),
  periodicidade: optStr,
  dataInicio: optStr,
  objetivos: optStr,
  metodologia: optStr,
  aulas: z.array(aulaNovaSchema).min(1, { error: "Adicione ao menos uma aula." }),
});
export type NovoPlanoInput = z.infer<typeof novoPlanoSchema>;

/** Registro de execução de uma aula (após a data prevista). */
export const execucaoSchema = z
  .object({
    execucao: z.enum(["Pendente", "Integral", "Parcial", "NaoDado"]),
    motivo: optStr,
    docenteTipo: optStr,
    docenteNome: optStr,
  })
  .refine((d) => d.execucao === "Integral" || d.execucao === "Pendente" || !!(d.motivo && d.motivo.trim()), {
    error: "Informe o motivo quando a aula não for dada integralmente.",
    path: ["motivo"],
  });
export type ExecucaoInput = z.infer<typeof execucaoSchema>;
