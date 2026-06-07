import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Cria um usuário no Supabase Auth (e-mail já confirmado) e retorna o id (uuid),
 * que será usado como id da tabela `usuario`. Lança em caso de erro.
 */
export async function criarAuthUsuario(email: string, senha: string, nome: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already")) {
      throw new Error("Já existe um usuário com este e-mail.");
    }
    throw new Error(error?.message ?? "Falha ao criar usuário no provedor de autenticação.");
  }
  return data.user.id;
}

/** Remove um usuário do Supabase Auth (best-effort). */
export async function removerAuthUsuario(id: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.auth.admin.deleteUser(id).catch(() => {});
}

/** Atualiza a senha de um usuário no Supabase Auth. */
export async function atualizarSenhaAuth(id: string, senha: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
  if (error) throw new Error(error.message);
}
