"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { uploadDocumento } from "@/lib/storage";
import { materialSchema, type MaterialInput } from "@/lib/validations/material";

type Result = { erro?: string };
type UploadResult = { path?: string; erro?: string };

/** Gera um slug seguro a partir do título, para compor o caminho no Storage. */
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

function toData(d: MaterialInput) {
  return {
    titulo: d.titulo,
    tipo: d.tipo,
    autor: d.autor ?? null,
    categoria: d.categoria ?? null,
    idDisciplina: d.idDisciplina ?? null,
    arquivoUrl: d.arquivoUrl ?? null,
    bibliografia: d.bibliografia ?? null,
    nivelAcesso: d.nivelAcesso,
  };
}

/**
 * Envia o arquivo (PDF/Word) anexado ao bucket "materiais" (caminho
 * `biblioteca/<slug>/<arquivo>`) e devolve o path salvo, para ser gravado
 * em `arquivoUrl`. Espelha o fluxo de upload das matrículas.
 */
export async function enviarArquivoMaterial(formData: FormData): Promise<UploadResult> {
  await requirePermission("biblioteca.gerenciar");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Selecione um arquivo para enviar." };
  }

  const slug = slugify(titulo || arquivo.name);
  const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const caminho = `biblioteca/${slug}/${Date.now()}-${nomeLimpo}`;

  try {
    const { path } = await uploadDocumento("materiais", caminho, arquivo, arquivo.type || undefined);
    return { path };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar o arquivo." };
  }
}

export async function criarMaterial(input: MaterialInput): Promise<Result> {
  const user = await requirePermission("biblioteca.gerenciar");
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const material = await prisma.materialBiblioteca.create({ data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MATERIAL_CRIADO",
    modulo: "Biblioteca",
    resultado: material.titulo,
  });
  revalidatePath("/painel/biblioteca");
  redirect("/painel/biblioteca");
}

export async function atualizarMaterial(id: string, input: MaterialInput): Promise<Result> {
  const user = await requirePermission("biblioteca.gerenciar");
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  await prisma.materialBiblioteca.update({ where: { id }, data: toData(parsed.data) });
  await registrarLog({
    idUsuario: user.id,
    perfil: user.vinculo,
    acao: "MATERIAL_ATUALIZADO",
    modulo: "Biblioteca",
    resultado: parsed.data.titulo,
  });
  revalidatePath("/painel/biblioteca");
  redirect("/painel/biblioteca");
}

export async function excluirMaterial(id: string): Promise<Result> {
  const user = await requirePermission("biblioteca.gerenciar");
  try {
    const material = await prisma.materialBiblioteca.delete({ where: { id } });
    await registrarLog({
      idUsuario: user.id,
      perfil: user.vinculo,
      acao: "MATERIAL_EXCLUIDO",
      modulo: "Biblioteca",
      resultado: material.titulo,
    });
  } catch {
    return { erro: "Não foi possível excluir o material." };
  }
  revalidatePath("/painel/biblioteca");
  return {};
}
