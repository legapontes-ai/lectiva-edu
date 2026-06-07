import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BucketUpload = "documentos" | "materiais" | "certificados";

/**
 * Faz upload de um arquivo no Supabase Storage usando a service_role key
 * (ignora RLS). Sobrescreve arquivo existente (upsert). Retorna o path salvo.
 */
export async function uploadDocumento(
  bucket: BucketUpload,
  caminho: string,
  arquivo: File | Buffer | ArrayBuffer,
  contentType?: string,
): Promise<{ path: string }> {
  const supabase = createSupabaseAdminClient();

  const tipo =
    contentType ?? (arquivo instanceof File ? arquivo.type || undefined : undefined);

  const { data, error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    upsert: true,
    ...(tipo ? { contentType: tipo } : {}),
  });

  if (error) {
    throw new Error(`Falha ao enviar arquivo para "${bucket}": ${error.message}`);
  }

  return { path: data.path };
}

/**
 * Cria uma URL assinada (temporária) para acesso a um arquivo privado.
 * Retorna null em caso de erro.
 */
export async function urlAssinada(
  bucket: string,
  path: string,
  expiraSeg = 3600,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiraSeg);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
