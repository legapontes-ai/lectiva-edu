"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/auth/dal";
import { registrarLog } from "@/lib/audit";
import { VINCULO_POR_PERFIL } from "@/lib/auth/permissions";
import {
  autocadastroSchema,
  politicaSenhaSchema,
  PERFIS_AUTOCADASTRO,
  type AutocadastroInput,
  type PoliticaSenhaInput,
} from "@/lib/validations/autocadastro";
import { criarAuthUsuario, removerAuthUsuario, atualizarSenhaAuth } from "@/lib/usuarios/service";

const DIAS_PADRAO = 7;

function gerarSenhaTemporaria(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "@7"; // garante símbolo + número
}

type SolicitarResult = { erro?: string; ok?: boolean; senhaTemporaria?: string; expiraEm?: string };
type Result = { erro?: string; ok?: boolean; senhaTemporaria?: string };

/** Autocadastro público: cria a conta INATIVA com senha temporária e entra na fila. */
export async function solicitarAutocadastro(input: AutocadastroInput): Promise<SolicitarResult> {
  const parsed = autocadastroSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  const d = parsed.data;

  // Rate-limit por IP
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    if (ip) {
      const recentes = await prisma.logAuditoria.count({
        where: { acao: "AUTOCADASTRO_SOLICITADO", ip, dataHora: { gte: new Date(Date.now() - 3600_000) } },
      });
      if (recentes >= 5) return { erro: "Muitas solicitações deste dispositivo. Tente mais tarde." };
    }
  } catch {}

  const perfil = await prisma.perfil.findUnique({ where: { id: d.idPerfil }, include: { politicaSenha: true } });
  if (!perfil || !PERFIS_AUTOCADASTRO.includes(perfil.nome as (typeof PERFIS_AUTOCADASTRO)[number])) {
    return { erro: "Perfil indisponível para autocadastro." };
  }

  const jaUsuario = await prisma.usuario.findUnique({ where: { email: d.email } });
  if (jaUsuario) return { erro: "Já existe uma conta com este e-mail." };
  const jaPendente = await prisma.autocadastro.findFirst({ where: { email: d.email, status: "Pendente" } });
  if (jaPendente) return { erro: "Já há uma solicitação pendente para este e-mail." };

  const dias = perfil.politicaSenha?.diasValidade ?? DIAS_PADRAO;
  const expira = new Date(Date.now() + dias * 86_400_000);
  const senhaTemp = gerarSenhaTemporaria();

  let authId: string;
  try {
    authId = await criarAuthUsuario(d.email, senhaTemp, d.nome);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao criar acesso." };
  }

  try {
    await prisma.$transaction([
      prisma.usuario.create({
        data: {
          id: authId,
          nome: d.nome,
          email: d.email,
          login: d.email,
          idPerfil: perfil.id,
          vinculo: VINCULO_POR_PERFIL[perfil.nome] ?? "Aluno",
          situacao: "Inativo", // só ativa após aprovação
          senhaProvisoria: true,
          deveTrocarSenha: true,
          senhaExpiraEm: expira,
        },
      }),
      prisma.autocadastro.create({
        data: {
          nome: d.nome,
          email: d.email,
          cpf: d.cpf ?? null,
          telefone: d.telefone ?? null,
          idPerfil: perfil.id,
          idUsuario: authId,
          status: "Pendente",
          senhaExpiraEm: expira,
        },
      }),
    ]);
  } catch {
    await removerAuthUsuario(authId);
    return { erro: "Não foi possível concluir o autocadastro." };
  }

  await registrarLog({ idUsuario: authId, perfil: perfil.nome, acao: "AUTOCADASTRO_SOLICITADO", modulo: "Autocadastro", resultado: d.email });
  revalidatePath("/painel/autocadastros");
  return { ok: true, senhaTemporaria: senhaTemp, expiraEm: expira.toISOString() };
}

/** Aprova um autocadastro pendente: ativa a conta. */
export async function aprovarAutocadastro(id: string): Promise<Result> {
  const ator = await requirePermission("autocadastro.gerenciar");
  const ac = await prisma.autocadastro.findUnique({ where: { id } });
  if (!ac || !ac.idUsuario) return { erro: "Solicitação não encontrada." };

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: ac.idUsuario }, data: { situacao: "Ativo" } }),
    prisma.autocadastro.update({ where: { id }, data: { status: "Aprovado", revisadoPor: ator.id, dataRevisao: new Date() } }),
  ]);
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "AUTOCADASTRO_APROVADO", modulo: "Autocadastro", resultado: ac.email });
  revalidatePath("/painel/autocadastros");
  return { ok: true };
}

/** Rejeita um autocadastro: bloqueia a conta. */
export async function rejeitarAutocadastro(id: string, motivo: string): Promise<Result> {
  const ator = await requirePermission("autocadastro.gerenciar");
  const ac = await prisma.autocadastro.findUnique({ where: { id } });
  if (!ac || !ac.idUsuario) return { erro: "Solicitação não encontrada." };

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: ac.idUsuario }, data: { situacao: "Bloqueado" } }),
    prisma.autocadastro.update({
      where: { id },
      data: { status: "Rejeitado", motivoRejeicao: motivo || null, revisadoPor: ator.id, dataRevisao: new Date() },
    }),
  ]);
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "AUTOCADASTRO_REJEITADO", modulo: "Autocadastro", resultado: ac.email });
  revalidatePath("/painel/autocadastros");
  return { ok: true };
}

/** Regenera a senha temporária e renova o prazo. */
export async function reenviarSenhaTemporaria(id: string): Promise<Result> {
  const ator = await requirePermission("autocadastro.gerenciar");
  const ac = await prisma.autocadastro.findUnique({ where: { id }, include: { perfil: { include: { politicaSenha: true } } } });
  if (!ac || !ac.idUsuario) return { erro: "Solicitação não encontrada." };

  const dias = ac.perfil.politicaSenha?.diasValidade ?? DIAS_PADRAO;
  const expira = new Date(Date.now() + dias * 86_400_000);
  const nova = gerarSenhaTemporaria();
  try {
    await atualizarSenhaAuth(ac.idUsuario, nova);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao atualizar a senha." };
  }
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: ac.idUsuario }, data: { senhaProvisoria: true, deveTrocarSenha: true, senhaExpiraEm: expira } }),
    prisma.autocadastro.update({ where: { id }, data: { senhaExpiraEm: expira, status: ac.status === "Expirado" ? "Pendente" : ac.status } }),
  ]);
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "AUTOCADASTRO_SENHA_REENVIADA", modulo: "Autocadastro", resultado: ac.email });
  revalidatePath("/painel/autocadastros");
  return { ok: true, senhaTemporaria: nova };
}

/** Define o prazo de validade da senha temporária por perfil. */
export async function definirPoliticaSenha(input: PoliticaSenhaInput): Promise<Result> {
  const ator = await requirePermission("parametros.gerenciar");
  const parsed = politicaSenhaSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };
  await prisma.politicaSenhaTemporaria.upsert({
    where: { idPerfil: parsed.data.idPerfil },
    update: { diasValidade: parsed.data.diasValidade },
    create: { idPerfil: parsed.data.idPerfil, diasValidade: parsed.data.diasValidade },
  });
  await registrarLog({ idUsuario: ator.id, perfil: ator.vinculo, acao: "POLITICA_SENHA_DEFINIDA", modulo: "Parametros", resultado: `${parsed.data.diasValidade}d` });
  revalidatePath("/painel/parametros");
  return { ok: true };
}

/** Marca que o usuário trocou a senha provisória (chamado após updateUser no client). */
export async function finalizarTrocaSenha(): Promise<Result> {
  const user = await requireUser();
  await prisma.usuario.update({
    where: { id: user.id },
    data: { senhaProvisoria: false, deveTrocarSenha: false, senhaExpiraEm: null },
  });
  await registrarLog({ idUsuario: user.id, perfil: user.vinculo, acao: "SENHA_DEFINITIVA_DEFINIDA", modulo: "Seguranca", resultado: "Sucesso" });
  return { ok: true };
}
