"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/audit";
import { loginSchema, solicitarResetSchema } from "@/lib/validations/auth";

type ActionResult = { erro?: string; ok?: boolean; mensagem?: string };

/** Login com e-mail/senha (Supabase Auth). Redireciona conforme o vínculo. */
export async function entrar(input: { email: string; senha: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { erro: "Dados inválidos." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error || !data.user) {
    await registrarLog({ acao: "LOGIN", modulo: "Seguranca", resultado: `Falha: ${parsed.data.email}` });
    return { erro: "E-mail ou senha inválidos." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: data.user.id } });
  if (!usuario || usuario.situacao !== "Ativo") {
    await supabase.auth.signOut();
    await registrarLog({
      idUsuario: data.user.id,
      acao: "LOGIN_BLOQUEADO",
      modulo: "Seguranca",
      resultado: usuario ? `Situação: ${usuario.situacao}` : "Sem cadastro",
    });
    return { erro: "Acesso indisponível. Procure a administração." };
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });
  await registrarLog({
    idUsuario: usuario.id,
    perfil: usuario.vinculo,
    acao: "LOGIN",
    modulo: "Seguranca",
    resultado: "Sucesso",
  });

  redirect(usuario.vinculo === "Aluno" ? "/aluno" : "/painel");
}

/** Logout. */
export async function sair(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    await registrarLog({ idUsuario: user.id, acao: "LOGOUT", modulo: "Seguranca", resultado: "Sucesso" });
  }
  redirect("/login");
}

/** Solicita e-mail de redefinição de senha. Resposta neutra (não revela se o e-mail existe). */
export async function solicitarReset(input: { email: string }): Promise<ActionResult> {
  const parsed = solicitarResetSchema.safeParse(input);
  if (!parsed.success) return { erro: "Informe um e-mail válido." };

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/redefinir-senha`,
  });
  await registrarLog({ acao: "RESET_SENHA_SOLICITADO", modulo: "Seguranca", resultado: parsed.data.email });

  return {
    ok: true,
    mensagem: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
  };
}
