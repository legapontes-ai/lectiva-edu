import "server-only";
import type { OrigemNota } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RegrasCurso = {
  notaMinimaAprovacao: number;
  frequenciaMinima: number;
  origemNota: OrigemNota;
  exigeTodasDisciplinas: boolean;
};

export type SituacaoDisciplina = {
  idDisciplina: string;
  nome: string;
  nota: number | null;
  frequencia: number | null;
  aprovada: boolean;
  motivo?: string;
};

export type ResultadoConsolidacao = {
  aprovadoNoCurso: boolean;
  semGrade: boolean;
  disciplinas: SituacaoDisciplina[];
  pendencias: string[];
};

/**
 * Consolida a situação acadêmica de um aluno num curso aplicando as REGRAS
 * PARAMETRIZADAS pelo administrador (nota mínima, frequência mínima, fonte da
 * nota e se exige todas as disciplinas). Não calcula médias: usa a nota
 * registrada na fonte escolhida (Avaliação oficial ou nota da atividade do plano).
 */
export async function consolidarSituacao(
  idAluno: string,
  idCurso: string,
  regras: RegrasCurso,
): Promise<ResultadoConsolidacao> {
  const grade = await prisma.gradeCurricular.findFirst({
    where: { idCurso },
    orderBy: { versao: "desc" },
    include: { disciplinas: { include: { disciplina: { select: { id: true, nome: true } } } } },
  });
  const discs = grade?.disciplinas.map((g) => g.disciplina) ?? [];
  if (discs.length === 0) {
    return { aprovadoNoCurso: false, semGrade: true, disciplinas: [], pendencias: [] };
  }

  const disciplinas: SituacaoDisciplina[] = [];
  for (const d of discs) {
    // Nota conforme a fonte parametrizada (sem cálculo de média).
    let nota: number | null = null;
    if (regras.origemNota === "Avaliacao") {
      const av = await prisma.avaliacao.findFirst({
        where: { idAluno, idDisciplina: d.id, nota: { not: null } },
        orderBy: { dataAplicacao: "desc" },
        select: { nota: true },
      });
      nota = av?.nota != null ? Number(av.nota) : null;
    } else {
      const na = await prisma.notaAtividade.findFirst({
        where: { idAluno, nota: { not: null }, atividade: { plano: { idDisciplina: d.id } } },
        orderBy: { atividade: { data: "desc" } },
        select: { nota: true },
      });
      nota = na?.nota != null ? Number(na.nota) : null;
    }

    // Frequência da disciplina: último percentual acumulado, ou presentes/total.
    const freqs = await prisma.frequencia.findMany({
      where: { idAluno, idDisciplina: d.id },
      orderBy: { dataAula: "desc" },
      select: { situacao: true, percentualAcumulado: true },
    });
    let frequencia: number | null = null;
    if (freqs.length) {
      const comPct = freqs.find((f) => f.percentualAcumulado != null);
      if (comPct) frequencia = Number(comPct.percentualAcumulado);
      else {
        const pres = freqs.filter((f) => f.situacao === "Presente").length;
        frequencia = Math.round((pres / freqs.length) * 100);
      }
    }

    const okNota = nota != null && nota >= regras.notaMinimaAprovacao;
    const okFreq = frequencia != null && frequencia >= regras.frequenciaMinima;
    const aprovada = okNota && okFreq;
    let motivo: string | undefined;
    if (!aprovada) {
      const partes: string[] = [];
      if (nota == null) partes.push("sem nota");
      else if (!okNota) partes.push(`nota ${nota.toFixed(1)} < ${regras.notaMinimaAprovacao}`);
      if (frequencia == null) partes.push("sem frequência");
      else if (!okFreq) partes.push(`frequência ${frequencia}% < ${regras.frequenciaMinima}%`);
      motivo = partes.join("; ");
    }
    disciplinas.push({ idDisciplina: d.id, nome: d.nome, nota, frequencia, aprovada, motivo });
  }

  const aprovadas = disciplinas.filter((d) => d.aprovada).length;
  const aprovadoNoCurso = regras.exigeTodasDisciplinas
    ? aprovadas === disciplinas.length
    : aprovadas >= 1;
  const pendencias = disciplinas.filter((d) => !d.aprovada).map((d) => `${d.nome}: ${d.motivo}`);

  return { aprovadoNoCurso, semGrade: false, disciplinas, pendencias };
}
