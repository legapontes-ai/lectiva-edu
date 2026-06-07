"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export type DistribuicaoItem = { nome: string; valor: number };

const CORES: Record<string, string> = {
  Adimplente: "var(--success)",
  Inadimplente: "var(--destructive)",
};

/**
 * Planos de pagamento por situação financeira (barras). Recebe dados já
 * agregados pelo servidor via props.
 */
export function InadimplenciaChart({
  distribuicao,
}: {
  distribuicao: DistribuicaoItem[];
}) {
  const total = distribuicao.reduce((s, d) => s + d.valor, 0);

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum plano de pagamento cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distribuicao} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="nome" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <Tooltip
            formatter={(v) => [`${Number(v)} plano(s)`, "Total"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
            {distribuicao.map((d) => (
              <Cell key={d.nome} fill={CORES[d.nome] ?? "var(--chart-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
