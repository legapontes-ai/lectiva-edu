"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/audit";
import { PERFIS } from "@/lib/auth/permissions";
import { criarAuthUsuario, removerAuthUsuario } from "@/lib/usuarios/service";
import { uploadDocumento } from "@/lib/storage";
import {
  matriculaSchema,
  type MatriculaInput,
  type DocumentoAnexo,
} from "@/lib/validations/matricula";

type CriarResult = { protocolo?: string; erro?: string };
type UploadResult = { arquivos?: DocumentoAnexo[]; erro?: string };

/** Gera um protocolo no formato MAT-AAAA-XXXX (sufixo aleatório). */
function gerarProtocolo(): string {
  const ano = new Date().getFullYear();
  const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `MAT-${ano}-${sufixo}`;
}

/** Sanitiza o e-mail para compor um caminho seguro no Storage. */
function sanitizarEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Envia os documentos anexados ao bucket "documentos" (caminho
 * `matriculas/<emailSanitizado>/<arquivo>`) e devolve os paths salvos.
 * Fluxo público — não exige login.
 */
export async function enviarDocumentosMatricula(formData: FormData): Promise<UploadResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe o e-mail antes de anexar documentos." };

  const arquivos = formData
    .getAll("arquivos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (arquivos.length === 0) return { arquivos: [] };

  const base = `matriculas/${sanitizarEmail(email)}`;
  const enviados: DocumentoAnexo[] = [];

  try {
    for (const arquivo of arquivos) {
      const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const caminho = `${base}/${Date.now()}-${nomeLimpo}`;
      const { path } = await uploadDocumento("documentos", caminho, arquivo, arquivo.type || undefined);
      enviados.push({ nome: arquivo.name, path });
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar os documentos." };
  }

  return { arquivos: enviados };
}

/**
 * Cria uma matrícula pública completa: conta no Supabase Auth + Usuário (Aluno),
 * Aluno, Consentimento (LGPD) e Matrícula (pré-matrícula com protocolo único).
 * Em caso de falha na transação, remove a conta de Auth criada (rollback).
 */
export async function criarMatricula(
  input: MatriculaInput,
  idCurso: string,
  idTurma?: string,
): Promise<CriarResult> {
  const parsed = matriculaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos. Revise as informações e tente novamente." };
  const d = parsed.data;

  // Rate-limit básico por IP: mitiga abuso de criação de contas no fluxo público.
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    if (ip) {
      const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
      const recentes = await prisma.logAuditoria.count({
        where: { acao: "MATRICULA_CRIADA", ip, dataHora: { gte: umaHoraAtras } },
      });
      if (recentes >= 5) {
        return { erro: "Muitas matrículas a partir deste dispositivo. Tente novamente mais tarde." };
      }
    }
  } catch {
    // sem contexto de request: segue sem rate-limit
  }

  const curso = await prisma.curso.findUnique({ where: { id: idCurso } });
  if (!curso) return { erro: "Curso não encontrado." };

  if (idTurma) {
    const turma = await prisma.turma.findFirst({ where: { id: idTurma, idCurso } });
    if (!turma) return { erro: "Turma inválida para o curso selecionado." };
  }

  const perfilAluno = await prisma.perfil.findUnique({ where: { nome: PERFIS.ALUNO } });
  if (!perfilAluno) return { erro: "Perfil 'Aluno' não encontrado. Contate a secretaria." };

  // Gera protocolo único (poucas tentativas; colisão é improvável).
  let protocolo = gerarProtocolo();
  for (let i = 0; i < 6; i++) {
    const existe = await prisma.matricula.findUnique({ where: { protocolo } });
    if (!existe) break;
    protocolo = gerarProtocolo();
  }

  let authId: string;
  try {
    authId = await criarAuthUsuario(d.email, d.senha, d.nome);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao criar o acesso do aluno." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.create({
        data: {
          id: authId,
          nome: d.nome,
          email: d.email,
          login: d.email,
          idPerfil: perfilAluno.id,
          vinculo: "Aluno",
          situacao: "Ativo",
        },
      });

      const aluno = await tx.aluno.create({
        data: {
          idUsuario: authId,
          nome: d.nome,
          email: d.email,
          cpf: d.cpf,
          rg: d.rg ?? null,
          dataNascimento: d.dataNascimento ? new Date(d.dataNascimento) : null,
          telefone: d.telefone,
          endereco: d.endereco,
          situacaoAcademica: "Ativo",
        },
      });

      const consentimento = await tx.consentimento.create({
        data: {
          idTitular: authId,
          finalidade: "Matrícula e gestão acadêmica",
          versaoPolitica: "1.0",
          canalColeta: "Matrícula online",
        },
      });

      const docs = d.documentosAnexos ?? [];
      await tx.matricula.create({
        data: {
          protocolo,
          idAluno: aluno.id,
          idCurso,
          idTurma: idTurma ?? null,
          filiacao: d.filiacao ?? null,
          nacionalidade: d.nacionalidade ?? null,
          estadoCivil: d.estadoCivil ?? null,
          formacaoGraduacao: d.formacaoGraduacao ?? null,
          instituicaoAnterior: d.instituicaoAnterior ?? null,
          anoConclusao: d.anoConclusao ?? null,
          numeroDiploma: d.numeroDiploma ?? null,
          documentosAnexos: docs.length > 0 ? docs : undefined,
          contratoAceito: true,
          dataAceite: new Date(),
          idConsentimento: consentimento.id,
          situacao: "PreMatricula",
        },
      });
    });
  } catch {
    await removerAuthUsuario(authId); // rollback
    return { erro: "Não foi possível concluir a matrícula (e-mail ou CPF já cadastrado)." };
  }

  await registrarLog({
    idUsuario: authId,
    perfil: "Aluno",
    acao: "MATRICULA_CRIADA",
    modulo: "Matrículas",
    resultado: protocolo,
  });

  return { protocolo };
}
