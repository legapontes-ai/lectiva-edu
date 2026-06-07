"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { lancarNotas, removerAtividade } from "@/lib/planos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/painel/delete-button";

type AtividadeGrid = {
  id: string;
  nome: string;
  peso: number;
  escalaMax: number;
  data: string | null;
  notas: { idAluno: string; nota: number | null }[];
};

type AlunoGrid = { id: string; nome: string };

function chave(idAtividade: string, idAluno: string) {
  return `${idAtividade}|${idAluno}`;
}

export function NotasGrid({
  idPlano,
  atividades,
  alunos,
  podeEditar,
}: {
  idPlano: string;
  atividades: AtividadeGrid[];
  alunos: AlunoGrid[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  // useForm apenas para estado de envio (submissão manual da grade).
  const { handleSubmit, formState: { isSubmitting } } = useForm();

  const inicial = useMemo(() => {
    const m: Record<string, string> = {};
    for (const at of atividades) {
      for (const n of at.notas) {
        if (n.nota != null) m[chave(at.id, n.idAluno)] = String(n.nota);
      }
    }
    return m;
  }, [atividades]);

  const [valores, setValores] = useState<Record<string, string>>(inicial);

  function setCelula(k: string, v: string) {
    setValores((prev) => ({ ...prev, [k]: v }));
    setSalvo(false);
  }

  // Média ponderada por aluno: normaliza cada nota para escala 0–10 e pondera pelo peso.
  const medias = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const al of alunos) {
      let somaPesos = 0;
      let somaPond = 0;
      for (const at of atividades) {
        const raw = valores[chave(at.id, al.id)];
        if (raw === undefined || raw === "") continue;
        const nota = Number(raw);
        if (Number.isNaN(nota)) continue;
        const normalizada = at.escalaMax > 0 ? (nota / at.escalaMax) * 10 : 0;
        somaPond += normalizada * at.peso;
        somaPesos += at.peso;
      }
      out[al.id] = somaPesos > 0 ? somaPond / somaPesos : null;
    }
    return out;
  }, [valores, atividades, alunos]);

  async function onSubmit() {
    setErro(null);
    setSalvo(false);
    const registros = [];
    for (const at of atividades) {
      for (const al of alunos) {
        const raw = valores[chave(at.id, al.id)];
        registros.push({
          idAtividade: at.id,
          idAluno: al.id,
          nota: raw === undefined || raw === "" ? undefined : Number(raw),
        });
      }
    }
    const res = await lancarNotas(idPlano, { registros });
    if (res?.erro) setErro(res.erro);
    else {
      setSalvo(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      {salvo && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> Notas salvas com sucesso.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Aluno</th>
              {atividades.map((at) => (
                <th key={at.id} className="px-3 py-3 font-semibold">
                  <div className="flex items-center gap-1">
                    <div className="min-w-0">
                      <div className="normal-case text-foreground">{at.nome}</div>
                      <div className="font-normal normal-case text-muted-foreground">
                        peso {at.peso} · /{at.escalaMax}
                        {at.data ? ` · ${at.data}` : ""}
                      </div>
                    </div>
                    {podeEditar && <DeleteButton action={removerAtividade.bind(null, at.id)} label="Remover atividade" />}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-right">Média (0–10)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alunos.map((al) => {
              const media = medias[al.id];
              return (
                <tr key={al.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium text-foreground">{al.nome}</td>
                  {atividades.map((at) => {
                    const k = chave(at.id, al.id);
                    return (
                      <td key={at.id} className="px-3 py-2">
                        <Input
                          aria-label={`${at.nome} — ${al.nome}`}
                          type="number"
                          step="0.1"
                          min={0}
                          max={at.escalaMax}
                          value={valores[k] ?? ""}
                          disabled={!podeEditar}
                          onChange={(e) => setCelula(k, e.target.value)}
                          className="w-24"
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right font-semibold text-primary">
                    {media === null
                      ? "—"
                      : media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        A média é ponderada pelo peso de cada atividade, com as notas normalizadas para a escala 0–10.
        Deixe a célula em branco para remover a nota.
      </p>

      {podeEditar && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Salvar notas
        </Button>
      )}
    </form>
  );
}
