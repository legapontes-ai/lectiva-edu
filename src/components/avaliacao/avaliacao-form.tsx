"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  lancarNotasSchema,
  type LancarNotasInput,
  TIPO_AVALIACAO_VALUES,
  FORMA_COLETA_VALUES,
  SITUACAO_AVALIACAO_VALUES,
} from "@/lib/validations/avaliacao";
import { lancarNotasEmLote } from "@/lib/avaliacao/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const SITUACAO_LABEL: Record<string, string> = {
  Aprovado: "Aprovado",
  Reprovado: "Reprovado",
  Recuperacao: "Recuperação",
};

export type AlunoAvaliacao = {
  id: string;
  nome: string;
  nota?: number | null;
  situacao?: (typeof SITUACAO_AVALIACAO_VALUES)[number] | null;
  percentualFrequencia?: number | null;
};

export function AvaliacaoForm({
  idDisciplina,
  idTurma,
  alunos,
}: {
  idDisciplina: string;
  idTurma: string;
  alunos: AlunoAvaliacao[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LancarNotasInput>({
    resolver: zodResolver(lancarNotasSchema) as never,
    defaultValues: {
      idDisciplina,
      idTurma,
      tipo: "Disciplina",
      formaColeta: "Identificada",
      dataAplicacao: "",
      registros: alunos.map((a) => ({
        idAluno: a.id,
        nota: a.nota ?? undefined,
        situacao: a.situacao ?? undefined,
        percentualFrequencia: a.percentualFrequencia ?? undefined,
      })),
    },
  });

  async function onSubmit(values: LancarNotasInput) {
    setErro(null);
    setSalvo(false);
    const res = await lancarNotasEmLote(values);
    if (res?.erro) setErro(res.erro);
    else {
      setSalvo(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      {salvo && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> Notas lançadas com sucesso.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Tipo de avaliação" htmlFor="tipo">
          <Select id="tipo" {...register("tipo")}>
            {TIPO_AVALIACAO_VALUES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Forma de coleta" htmlFor="formaColeta">
          <Select id="formaColeta" {...register("formaColeta")}>
            {FORMA_COLETA_VALUES.map((v) => (
              <option key={v} value={v}>{v === "Anonima" ? "Anônima" : v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data de aplicação" htmlFor="dataAplicacao">
          <Input id="dataAplicacao" type="date" {...register("dataAplicacao")} />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Aluno</th>
              <th className="px-4 py-3 font-semibold w-28">Nota (0–10)</th>
              <th className="px-4 py-3 font-semibold w-44">Situação</th>
              <th className="px-4 py-3 font-semibold w-32">Freq. (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alunos.map((a, i) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-medium text-foreground">
                  {a.nome}
                  <input type="hidden" {...register(`registros.${i}.idAluno`)} />
                </td>
                <td className="px-4 py-2">
                  <Input
                    aria-label={`Nota de ${a.nome}`}
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    {...register(`registros.${i}.nota`)}
                  />
                </td>
                <td className="px-4 py-2">
                  <Select aria-label={`Situação de ${a.nome}`} {...register(`registros.${i}.situacao`)}>
                    <option value="">— Automática —</option>
                    {SITUACAO_AVALIACAO_VALUES.map((v) => (
                      <option key={v} value={v}>{SITUACAO_LABEL[v]}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    aria-label={`Frequência de ${a.nome}`}
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    placeholder="auto"
                    {...register(`registros.${i}.percentualFrequencia`)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Situação automática: nota ≥ 7 Aprovado; ≥ 5 Recuperação; abaixo Reprovado. A frequência, se
        em branco, é puxada do acumulado de presença na disciplina.
      </p>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Lançar notas
      </Button>
    </form>
  );
}
