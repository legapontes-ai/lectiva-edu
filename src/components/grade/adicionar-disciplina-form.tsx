"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { adicionarDisciplinaSchema, type AdicionarDisciplinaInput } from "@/lib/grade/schema";
import { adicionarDisciplinaGrade } from "@/lib/grade/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type DisciplinaOpcao = {
  id: string;
  nome: string;
  codigo: string | null;
  cargaHoraria: number;
};

export function AdicionarDisciplinaForm({
  idGrade,
  disponiveis,
}: {
  idGrade: string;
  disponiveis: DisciplinaOpcao[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdicionarDisciplinaInput>({
    resolver: zodResolver(adicionarDisciplinaSchema) as never,
    defaultValues: { idDisciplina: "", periodo: undefined, preRequisito: "" },
  });

  if (disponiveis.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todas as disciplinas do curso já constam nesta grade.
      </p>
    );
  }

  async function onSubmit(values: AdicionarDisciplinaInput) {
    setErro(null);
    const res = await adicionarDisciplinaGrade(
      idGrade,
      values.idDisciplina,
      values.periodo ?? null,
      values.preRequisito ?? null,
    );
    if (res?.erro) {
      setErro(res.erro);
    } else {
      reset({ idDisciplina: "", periodo: undefined, preRequisito: "" });
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

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        <Field label="Disciplina" htmlFor={`disc-${idGrade}`} error={errors.idDisciplina?.message}>
          <Select id={`disc-${idGrade}`} {...register("idDisciplina")}>
            <option value="">— Selecione —</option>
            {disponiveis.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo ? `${d.codigo} — ` : ""}{d.nome} ({d.cargaHoraria}h)
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Período" htmlFor={`per-${idGrade}`} error={errors.periodo?.message} className="sm:w-24">
          <Input id={`per-${idGrade}`} type="number" min={1} placeholder="—" {...register("periodo")} />
        </Field>

        <Field label="Pré-requisito" htmlFor={`pre-${idGrade}`} error={errors.preRequisito?.message}>
          <Input id={`pre-${idGrade}`} placeholder="Opcional" {...register("preRequisito")} />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Adicionar
        </Button>
      </div>
    </form>
  );
}
