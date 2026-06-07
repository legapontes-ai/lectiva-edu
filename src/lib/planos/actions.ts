"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { uploadDocumento } from "@/lib/storage";
import {
  planoSchema,
  planoDetalhesSchema,
  aulaSchema,
  atividadeSchema,
  lancarNotasSchema,
  diarioSchema,
  ocorrenciaSchema,
  materialAulaSchema,
  type PlanoInput,
  type PlanoDetalhesInput,
  type AulaInput,
  type AtividadeInput,
  type LancarNotasPlanoInput,
  type DiarioInput,
  type OcorrenciaInput,
} from "@/lib/validations/plano";

type Result = { erro?: string; ok?: boolean };

const SEM_PROFESSOR = "Seu usuário não está vinculado a um cadastro de professor.";
const SEM_ACESSO = "Plano não encontrado ou fora do seu acesso.";

/** Resolve o Professor vinculado ao usuário logado (ou null). */
async function professorAtual(): Promise<{ id: string } | null> {
  const user = await requireUser();
  const professor = await prisma.professor.findUnique({
    where: { idUsuario: user.id },
    select: { id: true },
  });
  return professor;
}

/** Garante que o plano pertence ao professor logado; retorna {idProfessor, idTurma}. */
async function planoDoProfessor(idPlano: string): Promise<
  { erro: string } | { idProfessor: string; idTurma: string }
> {
  const professor = await professorAtual();
  if (!professor) return { erro: SEM_PROFESSOR };
  const plano = await prisma.planoAula.findFirst({
    where: { id: idPlano, idProfessor: professor.id },
    select: { id: true, idTurma: true },
  });
  if (!plano) return { erro: SEM_ACESSO };
  return { idProfessor: professor.id, idTurma: plano.idTurma };
}

/** Resolve o plano a partir de uma aula, validando o professor. */
async function planoDaAula(idAula: string): Promise<
  { erro: string } | { idPlano: string; idTurma: string }
> {
  const professor = await professorAtual();
  if (!professor) return { erro: SEM_PROFESSOR };
  const aula = await prisma.aulaPlanejada.findFirst({
    where: { id: idAula, plano: { idProfessor: professor.id } },
    select: { idPlano: true, plano: { select: { idTurma: true } } },
  });
  if (!aula) return { erro: SEM_ACESSO };
  return { idPlano: aula.idPlano, idTurma: aula.plano.idTurma };
}

// ----------------------------------------------------------------------------
// PLANO
// ----------------------------------------------------------------------------
export async function criarPlano(input: PlanoInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const parsed = planoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const professor = await prisma.professor.findUnique({
    where: { idUsuario: user.id },
    select: { id: true },
  });
  if (!professor) return { erro: SEM_PROFESSOR };

  // A disciplina precisa ser do professor logado.
  const disciplina = await prisma.disciplina.findFirst({
    where: { id: parsed.data.idDisciplina, idProfessor: professor.id },
    select: { id: true, nome: true },
  });
  if (!disciplina) return { erro: "Disciplina inválida ou não atribuída a você." };

  const existente = await prisma.planoAula.findUnique({
    where: { idDisciplina_idTurma: { idDisciplina: parsed.data.idDisciplina, idTurma: parsed.data.idTurma } },
    select: { id: true },
  });
  if (existente) return { erro: "Já existe um plano para esta disciplina e turma." };

  let novoId: string;
  try {
    const plano = await prisma.planoAula.create({
      data: {
        idDisciplina: parsed.data.idDisciplina,
        idTurma: parsed.data.idTurma,
        idProfessor: professor.id,
        objetivos: parsed.data.objetivos ?? null,
        metodologia: parsed.data.metodologia ?? null,
        status: parsed.data.status,
      },
      select: { id: true },
    });
    novoId = plano.id;
  } catch {
    return { erro: "Não foi possível criar o plano." };
  }

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "PLANO_CRIADO",
    modulo: "Planos de aula",
    resultado: disciplina.nome,
  });
  revalidatePath("/painel/planos");
  redirect(`/painel/planos/${novoId}`);
}

export async function atualizarPlano(idPlano: string, input: PlanoDetalhesInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = planoDetalhesSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.planoAula.update({
    where: { id: idPlano },
    data: {
      objetivos: parsed.data.objetivos ?? null,
      metodologia: parsed.data.metodologia ?? null,
      status: parsed.data.status,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "PLANO_ATUALIZADO",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// AULAS
// ----------------------------------------------------------------------------
export async function adicionarAula(idPlano: string, input: AulaInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = aulaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  let ordem = parsed.data.ordem;
  if (ordem === undefined) {
    const max = await prisma.aulaPlanejada.aggregate({
      where: { idPlano },
      _max: { ordem: true },
    });
    ordem = (max._max.ordem ?? 0) + 1;
  }

  await prisma.aulaPlanejada.create({
    data: {
      idPlano,
      ordem,
      titulo: parsed.data.titulo,
      conteudo: parsed.data.conteudo ?? null,
      objetivos: parsed.data.objetivos ?? null,
      dataPrevista: parsed.data.dataPrevista ? new Date(parsed.data.dataPrevista) : null,
      cargaHoraria: parsed.data.cargaHoraria ?? null,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "AULA_ADICIONADA",
    modulo: "Planos de aula",
    resultado: parsed.data.titulo,
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}

export async function atualizarAula(idAula: string, input: AulaInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const ctx = await planoDaAula(idAula);
  if ("erro" in ctx) return ctx;
  const parsed = aulaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.aulaPlanejada.update({
    where: { id: idAula },
    data: {
      titulo: parsed.data.titulo,
      conteudo: parsed.data.conteudo ?? null,
      objetivos: parsed.data.objetivos ?? null,
      dataPrevista: parsed.data.dataPrevista ? new Date(parsed.data.dataPrevista) : null,
      cargaHoraria: parsed.data.cargaHoraria ?? null,
      ...(parsed.data.ordem !== undefined ? { ordem: parsed.data.ordem } : {}),
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "AULA_ATUALIZADA",
    modulo: "Planos de aula",
    resultado: parsed.data.titulo,
  });
  revalidatePath(`/painel/planos/${ctx.idPlano}`);
  return { ok: true };
}

export async function removerAula(idAula: string): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const ctx = await planoDaAula(idAula);
  if ("erro" in ctx) return ctx;

  await prisma.aulaPlanejada.delete({ where: { id: idAula } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "AULA_REMOVIDA",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${ctx.idPlano}`);
  return { ok: true };
}

export async function alternarConclusaoAula(idAula: string): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const ctx = await planoDaAula(idAula);
  if ("erro" in ctx) return ctx;

  const aula = await prisma.aulaPlanejada.findUnique({
    where: { id: idAula },
    select: { concluida: true },
  });
  if (!aula) return { erro: SEM_ACESSO };

  const concluida = !aula.concluida;
  await prisma.aulaPlanejada.update({
    where: { id: idAula },
    data: { concluida, dataConclusao: concluida ? new Date() : null },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: concluida ? "AULA_CONCLUIDA" : "AULA_REABERTA",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${ctx.idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// MATERIAIS DA AULA
// ----------------------------------------------------------------------------
function slugify(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "material";
}

export async function adicionarMaterialAula(idAula: string, formData: FormData): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const ctx = await planoDaAula(idAula);
  if ("erro" in ctx) return ctx;

  const titulo = String(formData.get("titulo") ?? "").trim();
  const urlInformada = String(formData.get("arquivoUrl") ?? "").trim();
  const arquivo = formData.get("arquivo");

  const validacao = materialAulaSchema.safeParse({ titulo, arquivoUrl: urlInformada || undefined });
  if (!validacao.success) return { erro: "Informe o título do material." };

  let arquivoUrl: string | null = urlInformada || null;

  if (arquivo instanceof File && arquivo.size > 0) {
    const slug = slugify(titulo || arquivo.name);
    const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const caminho = `planos/${idAula}/${slug}/${Date.now()}-${nomeLimpo}`;
    try {
      const { path } = await uploadDocumento("materiais", caminho, arquivo, arquivo.type || undefined);
      arquivoUrl = path;
    } catch (e) {
      return { erro: e instanceof Error ? e.message : "Falha ao enviar o arquivo." };
    }
  }

  if (!arquivoUrl) return { erro: "Anexe um arquivo ou informe uma URL." };

  await prisma.aulaMaterial.create({
    data: { idAula, titulo, arquivoUrl },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MATERIAL_AULA_ADICIONADO",
    modulo: "Planos de aula",
    resultado: titulo,
  });
  revalidatePath(`/painel/planos/${ctx.idPlano}`);
  return { ok: true };
}

export async function removerMaterialAula(idMaterial: string): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const professor = await professorAtual();
  if (!professor) return { erro: SEM_PROFESSOR };

  const material = await prisma.aulaMaterial.findFirst({
    where: { id: idMaterial, aula: { plano: { idProfessor: professor.id } } },
    select: { id: true, aula: { select: { idPlano: true } } },
  });
  if (!material) return { erro: SEM_ACESSO };

  await prisma.aulaMaterial.delete({ where: { id: idMaterial } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MATERIAL_AULA_REMOVIDO",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${material.aula.idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// ATIVIDADES AVALIATIVAS
// ----------------------------------------------------------------------------
export async function criarAtividade(idPlano: string, input: AtividadeInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = atividadeSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.atividadeAvaliativa.create({
    data: {
      idPlano,
      nome: parsed.data.nome,
      peso: parsed.data.peso,
      escalaMax: parsed.data.escalaMax,
      data: parsed.data.data ? new Date(parsed.data.data) : null,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "ATIVIDADE_CRIADA",
    modulo: "Planos de aula",
    resultado: parsed.data.nome,
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}

export async function removerAtividade(idAtividade: string): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const professor = await professorAtual();
  if (!professor) return { erro: SEM_PROFESSOR };

  const atividade = await prisma.atividadeAvaliativa.findFirst({
    where: { id: idAtividade, plano: { idProfessor: professor.id } },
    select: { id: true, idPlano: true },
  });
  if (!atividade) return { erro: SEM_ACESSO };

  await prisma.atividadeAvaliativa.delete({ where: { id: idAtividade } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "ATIVIDADE_REMOVIDA",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${atividade.idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// NOTAS (lote)
// ----------------------------------------------------------------------------
export async function lancarNotas(idPlano: string, input: LancarNotasPlanoInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = lancarNotasSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  // Atividades válidas deste plano.
  const atividades = await prisma.atividadeAvaliativa.findMany({
    where: { idPlano },
    select: { id: true },
  });
  const atividadeIds = new Set(atividades.map((a) => a.id));
  const registros = parsed.data.registros.filter((r) => atividadeIds.has(r.idAtividade));

  try {
    await prisma.$transaction(
      registros.map((r) => {
        const nota = r.nota === undefined ? null : r.nota;
        if (nota === null) {
          return prisma.notaAtividade.deleteMany({
            where: { idAtividade: r.idAtividade, idAluno: r.idAluno },
          });
        }
        return prisma.notaAtividade.upsert({
          where: { idAtividade_idAluno: { idAtividade: r.idAtividade, idAluno: r.idAluno } },
          create: { idAtividade: r.idAtividade, idAluno: r.idAluno, nota },
          update: { nota },
        });
      }),
    );
  } catch {
    return { erro: "Não foi possível salvar as notas." };
  }

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "NOTAS_LANCADAS",
    modulo: "Planos de aula",
    resultado: `${registros.length} registro(s)`,
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// DIÁRIO DE CLASSE
// ----------------------------------------------------------------------------
export async function adicionarDiario(idPlano: string, input: DiarioInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = diarioSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  // Se uma aula foi indicada, ela precisa ser deste plano.
  let idAula: string | null = parsed.data.idAula ?? null;
  if (idAula) {
    const aula = await prisma.aulaPlanejada.findFirst({
      where: { id: idAula, idPlano },
      select: { id: true },
    });
    if (!aula) idAula = null;
  }

  await prisma.diarioClasse.create({
    data: {
      idPlano,
      idAula,
      data: new Date(parsed.data.data),
      conteudoMinistrado: parsed.data.conteudoMinistrado ?? null,
      observacoes: parsed.data.observacoes ?? null,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "DIARIO_REGISTRADO",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// OCORRÊNCIAS POR ALUNO
// ----------------------------------------------------------------------------
export async function adicionarOcorrencia(idPlano: string, input: OcorrenciaInput): Promise<Result> {
  const user = await requirePermission("planos.elaborar");
  const dono = await planoDoProfessor(idPlano);
  if ("erro" in dono) return dono;
  const parsed = ocorrenciaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  // Aula opcional precisa ser do plano.
  let idAula: string | null = parsed.data.idAula ?? null;
  if (idAula) {
    const aula = await prisma.aulaPlanejada.findFirst({
      where: { id: idAula, idPlano },
      select: { id: true },
    });
    if (!aula) idAula = null;
  }

  await prisma.ocorrencia.create({
    data: {
      idAluno: parsed.data.idAluno,
      idTurma: dono.idTurma,
      idAula,
      tipo: parsed.data.tipo ?? null,
      descricao: parsed.data.descricao,
      data: new Date(parsed.data.data),
      registradoPor: user.id,
    },
  });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "OCORRENCIA_REGISTRADA",
    modulo: "Planos de aula",
  });
  revalidatePath(`/painel/planos/${idPlano}`);
  return { ok: true };
}
