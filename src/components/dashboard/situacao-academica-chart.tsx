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
  Ativo: "var(--success)",
  Concluinte: "var(--chart-2)",
  Inativo: "var(--muted-foreground)",
};

/**
 * Distribuição de alunos por situação acadêmica (donut). Recebe dados já
 * agregados pelo servidor via props.
 */
export function SituacaoAcademicaChart({ distribuicao }: { distribuicao: DistribuicaoItem[] }) {
  const total = distribuicao.reduce((s, d) => s + d.valor, 0);

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum aluno cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distribuicao}
            dataKey="valor"
            nameKey="nome"
            innerRadius={50}
            outerRadius={88}
            paddingAngle={2}
          >
            {distribuicao.map((d) => (
              <Cell key={d.nome} fill={CORES[d.nome] ?? "var(--chart-1)"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [`${Number(v)} aluno(s)`, String(n)]}
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
  );
}
