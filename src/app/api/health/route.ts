import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health check: confirma que o app responde e que o banco está acessível. */
export async function GET() {
  try {
    const perfis = await prisma.perfil.count();
    return NextResponse.json({
      status: "ok",
      db: "conectado",
      perfis,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { status: "erro", db: "indisponivel", erro: e instanceof Error ? e.message : String(e) },
      { status: 503 },
    );
  }
}
