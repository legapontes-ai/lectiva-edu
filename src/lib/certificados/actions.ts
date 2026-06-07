"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { registrarLog } from "@/lib/audit";
import { uploadDocumento, urlAssinada } from "@/lib/storage";
import { formatarData } from "@/lib/format";
import { renderCertificadoPDF } from "@/lib/certificados/pdf";
import {
  modeloCertificadoSchema,
  emitirCertificadoSchema,
  type ModeloCertificadoInput,
} from "@/lib/validations/certificado";

type Result = { erro?: string };

const BUCKET = "certificados" as const;

// ---------------------------------------------------------------------------
// CRUD de ModeloCertificado
// ---------------------------------------------------------------------------
function toModeloData(d: ModeloCertificadoInput) {
  return {
    nome: d.nome,
    tipo: d.tipo,
    layout: d.layout ?? null,
    textoPadrao: d.textoPadrao ?? null,
    requisitos: d.requisitos ?? null,
    situacao: d.situacao,
  };
}

export async function criarModelo(input: ModeloCertificadoInput): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  const parsed = modeloCertificadoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const modelo = await prisma.modeloCertificado.create({ data: toModeloData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MODELO_CERTIFICADO_CRIADO",
    modulo: "Certificados",
    resultado: modelo.nome,
  });
  revalidatePath("/painel/certificados");
  redirect("/painel/certificados");
}

export async function atualizarModelo(
  id: string,
  input: ModeloCertificadoInput,
): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  const parsed = modeloCertificadoSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.modeloCertificado.update({ where: { id }, data: toModeloData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MODELO_CERTIFICADO_ATUALIZADO",
    modulo: "Certificados",
    resultado: parsed.data.nome,
  });
  revalidatePath("/painel/certificados");
  redirect("/painel/certificados");
}

export async function excluirModelo(id: string): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  try {
    const modelo = await prisma.modeloCertificado.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "MODELO_CERTIFICADO_EXCLUIDO",
      modulo: "Certificados",
      resultado: modelo.nome,
    });
  } catch {
    return { erro: "Não foi possível excluir (há certificados emitidos com este modelo)." };
  }
  revalidatePath("/painel/certificados");
  return {};
}

// ---------------------------------------------------------------------------
// Emissão / cancelamento / reemissão
// ---------------------------------------------------------------------------

/** Gera um código de autenticação hexadecimal único (12 caracteres). */
async function gerarCodigoUnico(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const codigo = randomBytes(6).toString("hex").toUpperCase();
    const existe = await prisma.certificado.findUnique({
      where: { codigoAutenticacao: codigo },
      select: { id: true },
    });
    if (!existe) return codigo;
  }
  throw new Error("Falha ao gerar código de autenticação.");
}

/** Renderiza o PDF, faz upload e devolve o path salvo. */
async function gerarEEnviarPdf(params: {
  codigo: string;
  aluno: string;
  curso: string;
  cargaHoraria: number | null;
  data: Date;
  tipo: string;
  textoPadrao: string | null;
}): Promise<string> {
  const buffer = await renderCertificadoPDF({
    aluno: params.aluno,
    curso: params.curso,
    cargaHoraria: params.cargaHoraria,
    data: formatarData(params.data),
    codigo: params.codigo,
    textoPadrao: params.textoPadrao,
    tipo: params.tipo,
  });
  const { path } = await uploadDocumento(
    BUCKET,
    `certificados/${params.codigo}.pdf`,
    buffer,
    "application/pdf",
  );
  return path;
}

export async function emitirCertificado(
  idAluno: string,
  idCurso: string,
  idModelo: string,
): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  const parsed = emitirCertificadoSchema.safeParse({ idAluno, idCurso, idModelo });
  if (!parsed.success) return { erro: "Selecione aluno, curso e modelo." };

  const [aluno, curso, modelo] = await Promise.all([
    prisma.aluno.findUnique({ where: { id: idAluno }, select: { id: true, nome: true } }),
    prisma.curso.findUnique({
      where: { id: idCurso },
      select: { id: true, nome: true, cargaHoraria: true },
    }),
    prisma.modeloCertificado.findUnique({
      where: { id: idModelo },
      select: { id: true, tipo: true, textoPadrao: true, situacao: true },
    }),
  ]);

  if (!aluno) return { erro: "Aluno não encontrado." };
  if (!curso) return { erro: "Curso não encontrado." };
  if (!modelo) return { erro: "Modelo não encontrado." };
  if (modelo.situacao !== "Ativo") return { erro: "O modelo selecionado está inativo." };

  // Requisito 1 — regularidade financeira: nenhuma parcela vencida.
  const parcelasVencidas = await prisma.parcela.count({
    where: { situacao: "Vencida", plano: { idAluno } },
  });
  if (parcelasVencidas > 0) {
    return {
      erro: `Emissão bloqueada: o aluno possui ${parcelasVencidas} parcela(s) vencida(s). Regularize a situação financeira antes de emitir.`,
    };
  }

  // Requisito 2 — aprovação registrada (Avaliacao com situacao "Aprovado").
  const aprovacao = await prisma.avaliacao.findFirst({
    where: { idAluno, situacao: "Aprovado" },
    select: { id: true },
  });
  if (!aprovacao) {
    return {
      erro: "Emissão bloqueada: não há avaliação com situação \"Aprovado\" registrada para o aluno.",
    };
  }

  const codigo = await gerarCodigoUnico();
  const cargaHoraria = curso.cargaHoraria ?? null;

  const certificado = await prisma.certificado.create({
    data: {
      idAluno,
      idCurso,
      idModelo,
      cargaHoraria,
      tipo: modelo.tipo,
      codigoAutenticacao: codigo,
      situacao: "Emitido",
    },
  });

  try {
    const path = await gerarEEnviarPdf({
      codigo,
      aluno: aluno.nome,
      curso: curso.nome,
      cargaHoraria,
      data: certificado.dataEmissao,
      tipo: modelo.tipo,
      textoPadrao: modelo.textoPadrao,
    });
    await prisma.certificado.update({ where: { id: certificado.id }, data: { arquivoPdf: path } });
  } catch {
    await prisma.certificado.delete({ where: { id: certificado.id } });
    return { erro: "Falha ao gerar o PDF do certificado. Tente novamente." };
  }

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CERTIFICADO_EMITIDO",
    modulo: "Certificados",
    resultado: `${aluno.nome} — ${curso.nome} (${codigo})`,
  });
  revalidatePath("/painel/certificados");
  return {};
}

export async function cancelarCertificado(id: string): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  const cert = await prisma.certificado.findUnique({
    where: { id },
    select: { situacao: true, codigoAutenticacao: true },
  });
  if (!cert) return { erro: "Certificado não encontrado." };
  if (cert.situacao === "Cancelado") return { erro: "Este certificado já está cancelado." };

  await prisma.certificado.update({ where: { id }, data: { situacao: "Cancelado" } });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CERTIFICADO_CANCELADO",
    modulo: "Certificados",
    resultado: cert.codigoAutenticacao,
  });
  revalidatePath("/painel/certificados");
  return {};
}

export async function reemitirCertificado(id: string): Promise<Result> {
  const user = await requirePermission("certificados.gerenciar");
  const antigo = await prisma.certificado.findUnique({
    where: { id },
    include: {
      aluno: { select: { nome: true } },
      curso: { select: { nome: true } },
      modelo: { select: { textoPadrao: true } },
    },
  });
  if (!antigo) return { erro: "Certificado não encontrado." };

  const codigo = await gerarCodigoUnico();
  const novo = await prisma.certificado.create({
    data: {
      idAluno: antigo.idAluno,
      idCurso: antigo.idCurso,
      idModelo: antigo.idModelo,
      cargaHoraria: antigo.cargaHoraria,
      tipo: antigo.tipo,
      codigoAutenticacao: codigo,
      situacao: "Emitido",
    },
  });

  try {
    const path = await gerarEEnviarPdf({
      codigo,
      aluno: antigo.aluno.nome,
      curso: antigo.curso.nome,
      cargaHoraria: antigo.cargaHoraria ?? null,
      data: novo.dataEmissao,
      tipo: antigo.tipo,
      textoPadrao: antigo.modelo?.textoPadrao ?? null,
    });
    await prisma.certificado.update({ where: { id: novo.id }, data: { arquivoPdf: path } });
  } catch {
    await prisma.certificado.delete({ where: { id: novo.id } });
    return { erro: "Falha ao gerar o PDF da reemissão. Tente novamente." };
  }

  // Marca o anterior como Reemitido.
  await prisma.certificado.update({ where: { id }, data: { situacao: "Reemitido" } });

  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "CERTIFICADO_REEMITIDO",
    modulo: "Certificados",
    resultado: `${antigo.codigoAutenticacao} -> ${codigo}`,
  });
  revalidatePath("/painel/certificados");
  return {};
}

export async function baixarCertificado(id: string): Promise<{ url?: string; erro?: string }> {
  const user = await requireUser();
  const podeBaixar =
    can(user.permissoes, "certificados.gerenciar") || can(user.permissoes, "certificados.baixar");
  if (!podeBaixar) return { erro: "Sem permissão para baixar certificados." };

  const cert = await prisma.certificado.findUnique({
    where: { id },
    select: { arquivoPdf: true },
  });
  if (!cert?.arquivoPdf) return { erro: "Arquivo do certificado não disponível." };

  const url = await urlAssinada(BUCKET, cert.arquivoPdf, 3600);
  if (!url) return { erro: "Não foi possível gerar o link de download." };
  return { url };
}
