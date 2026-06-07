import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type RegistrarLogParams = {
  idUsuario?: string | null;
  perfil?: string | null;
  acao: string;
  modulo?: string | null;
  resultado?: string | null;
};

/**
 * Registra uma ação crítica na trilha de auditoria (LGPD / segurança).
 * Captura o IP a partir dos headers da requisição. Nunca lança — falha de log
 * não deve quebrar a operação principal.
 */
export async function registrarLog(params: RegistrarLogParams): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        null;
    } catch {
      // fora de um contexto de requisição
    }
    await prisma.logAuditoria.create({
      data: {
        idUsuario: params.idUsuario ?? null,
        perfil: params.perfil ?? null,
        acao: params.acao,
        modulo: params.modulo ?? null,
        ip,
        resultado: params.resultado ?? "Sucesso",
      },
    });
  } catch (e) {
    console.error("[audit] falha ao registrar log:", e);
  }
}
