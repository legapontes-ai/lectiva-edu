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

export type ConformidadeResumo = {
  conformes: number;
  naoConformes: number;
  pendentes: number;
};

const CORES = ["var(--success)", "var(--destructive)", "var(--chart-2)"];

/**
 * Gráfico de barras do panorama de conformidade dos planos.
 * Recebe os totais já agregados pelo servidor.
 */
export function ConformidadeChart({ resumo }: { resumo: ConformidadeResumo }) {
  const dados = [
    { nome: "Conformes", valor: resumo.conformes },
    { nome: "Não conformes", valor: resumo.naoConformes },
    { nome: "Pendentes", valor: resumo.pendentes },
  ];
  const total = dados.reduce((s, d) => s + d.valor, 0);

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum plano de aula cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            {dados.map((d, i) => (
              <Cell key={d.nome} fill={CORES[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
