"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type SerieMensal = { nome: string; valor: number };

/**
 * Matrículas por mês (últimos ~6 meses). Recebe a série já agregada pelo
 * servidor via props, a partir de Matricula.dataMatricula.
 */
export function MatriculasMesChart({ dados }: { dados: SerieMensal[] }) {
  const total = dados.reduce((s, d) => s + d.valor, 0);

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma matrícula registrada no período.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="nome" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <Tooltip
            formatter={(v) => [`${Number(v)} matrícula(s)`, "Total"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey="valor" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
