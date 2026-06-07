import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { retrySupabase } from "@/lib/resiliencia";
import { can, type Permissao } from "@/lib/auth/permissions";
import type { Vinculo } from "@prisma/client";

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  vinculo: Vinculo;
  perfilNome: string;
  permissoes: Set<string>;
};

/**
 * Usuário autenticado da requisição atual (ou null). Memoizado por request.
 * Valida a sessão no Supabase Auth e carrega perfil + permissões do banco.
 * Usuários Inativos/Bloqueados são tratados como não autenticados.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await retrySupabase(() => supabase.auth.getUser(), { rotulo: "auth.getUser", tentativas: 3 });
  const user = data.user;
  if (!user) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { perfil: { include: { permissoes: true } } },
  });
  if (!usuario || usuario.situacao !== "Ativo") return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    vinculo: usuario.vinculo,
    perfilNome: usuario.perfil.nome,
    permissoes: new Set(usuario.perfil.permissoes.map((p) => p.permissao)),
  };
});

/** Exige autenticação; redireciona para /login se não houver. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige uma permissão; redireciona se não autorizado. */
export async function requirePermission(permissao: Permissao): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.permissoes, permissao)) {
    redirect(`/painel/acesso-negado?permissao=${encodeURIComponent(permissao)}`);
  }
  return user;
}

/** Conveniência para checagem booleana em componentes. */
export async function temPermissao(permissao: Permissao): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && can(user.permissoes, permissao);
}
