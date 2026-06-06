import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role key — SOMENTE no servidor.
 * Ignora RLS e tem privilégios administrativos (criar usuários no Auth,
 * uploads no Storage como admin, etc.). NUNCA expor ao client.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
