"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, CheckCheck } from "lucide-react";
import {
  frequenciaEmLoteSchema,
  type FrequenciaEmLoteInput,
  SITUACAO_FREQUENCIA_VALUES,
  TIPO_ENCONTRO_VALUES,
} from "@/lib/validations/frequencia";
import { registrarFrequenciaEmLote } from "@/lib/frequencia/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const SITUACAO_LABEL: Record<string, string> = {
  Presente: "Presente",
  Ausente: "Ausente",
  Justificado: "Justificado",
};

export type AlunoFrequencia = {
  id: string;
  nome: string;
  situacao?: (typeof SITUACAO_FREQUENCIA_VALUES)[number];
  justificativa?: string | null;
};

export function FrequenciaForm({
  idDisciplina,
  idTurma,
  dataAula,
  alunos,
}: {
  idDisciplina: string;
  idTurma: string;
  dataAula: string;
  alunos: AlunoFrequencia[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FrequenciaEmLoteInput>({
    resolver: zodResolver(frequenciaEmLoteSchema) as never,
    defaultValues: {
      idDisciplina,
      idTurma,
      dataAula,
      tipoEncontro: "Presencial",
      registros: alunos.map((a) => ({
        idAluno: a.id,
        situacao: a.situacao ?? "Presente",
        justificativa: a.justificativa ?? "",
      })),
    },
  });

  async function onSubmit(values: FrequenciaEmLoteInput) {
    setErro(null);
    setSalvo(false);
    const res = await registrarFrequenciaEmLote(values);
    if (res?.erro) setErro(res.erro);
    else {
      setSalvo(true);
      router.refresh();
    }
  }

  function marcarTodosPresentes() {
    alunos.forEach((_, i) => setValue(`registros.${i}.situacao`, "Presente"));
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
          <CheckCircle2 className="size-4 shrink-0" /> Frequência salva com sucesso.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Tipo de encontro" htmlFor="tipoEncontro" className="w-full sm:w-56">
          <Select id="tipoEncontro" {...register("tipoEncontro")}>
            {TIPO_ENCONTRO_VALUES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <Button type="button" variant="outline" size="sm" onClick={marcarTodosPresentes}>
          <CheckCheck className="size-4" /> Marcar todos presentes
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Aluno</th>
              <th className="px-4 py-3 font-semibold w-44">Situação</th>
              <th className="px-4 py-3 font-semibold">Justificativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alunos.map((a, i) => {
              const situacao = watch(`registros.${i}.situacao`);
              return (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium text-foreground">
                    {a.nome}
                    <input type="hidden" {...register(`registros.${i}.idAluno`)} />
                  </td>
                  <td className="px-4 py-2">
                    <Select aria-label={`Situação de ${a.nome}`} {...register(`registros.${i}.situacao`)}>
                      {SITUACAO_FREQUENCIA_VALUES.map((v) => (
                        <option key={v} value={v}>{SITUACAO_LABEL[v]}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      aria-label={`Justificativa de ${a.nome}`}
                      placeholder={situacao === "Justificado" ? "Motivo da ausência" : "—"}
                      disabled={situacao !== "Justificado"}
                      {...register(`registros.${i}.justificativa`)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Salvar frequência
      </Button>
    </form>
  );
}
