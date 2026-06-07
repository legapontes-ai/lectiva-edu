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
  Aprovado: "var(--success)",
  Reprovado: "var(--destructive)",
  Recuperacao: "var(--chart-2)",
};

/**
 * Indicadores de avaliação: distribuição de situações (barras) e média de
 * notas. Recebe dados já agregados pelo servidor via props.
 */
export function AvaliacaoChart({
  distribuicao,
  mediaNota,
}: {
  distribuicao: DistribuicaoItem[];
  mediaNota: number | null;
}) {
  const total = distribuicao.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Situação dos alunos
        </p>
        {total === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sem avaliações lançadas ainda.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribuicao} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  formatter={(v) => [`${Number(v)} aluno(s)`, "Total"]}
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
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Média de notas
        </span>
        <span className="text-4xl font-bold text-primary">
          {mediaNota === null
            ? "—"
            : mediaNota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-muted-foreground">{total} avaliação(ões) lançada(s)</span>
      </div>
    </div>
  );
}
