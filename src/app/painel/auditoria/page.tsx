import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "@/lib/format";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Auditoria" };

export default async function AuditoriaPage() {
  await requirePermission("logs.ver");

  const logs = await prisma.logAuditoria.findMany({
    orderBy: { dataHora: "desc" },
    take: 100,
    include: { usuario: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Trilha de auditoria</h1>
        <p className="mt-1 text-muted-foreground">
          Registro das ações críticas do sistema (LGPD). Exibindo os 100 eventos mais recentes.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Data/hora</th>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Ação</th>
                <th className="px-4 py-3 font-semibold">Módulo</th>
                <th className="px-4 py-3 font-semibold">Resultado</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum evento registrado.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatarDataHora(log.dataHora)}
                  </td>
                  <td className="px-4 py-3">{log.usuario?.nome ?? log.perfil ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{log.acao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.modulo ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.resultado ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{log.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
