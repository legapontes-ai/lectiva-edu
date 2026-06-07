"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export type DistribuicaoItem = { nome: string; valor: number };

const CORES: Record<string, string> = {
  Presente: "var(--success)",
  Ausente: "var(--destructive)",
  Justificado: "var(--chart-2)",
};

/**
 * Indicadores de frequência: distribuição de situações (pizza) e média de
 * presença. Recebe dados já agregados pelo servidor via props.
 */
export function FrequenciaChart({
  distribuicao,
  mediaFrequencia,
}: {
  distribuicao: DistribuicaoItem[];
  mediaFrequencia: number;
}) {
  const total = distribuicao.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Distribuição de presença
        </p>
        {total === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sem registros de frequência ainda.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicao}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {distribuicao.map((d) => (
                    <Cell key={d.nome} fill={CORES[d.nome] ?? "var(--chart-1)"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`${Number(v)} registro(s)`, String(n)]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Média de presença
        </span>
        <span className="text-4xl font-bold text-primary">
          {mediaFrequencia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
        </span>
        <span className="text-xs text-muted-foreground">
          {total} registro(s) considerados
        </span>
      </div>
    </div>
  );
}
