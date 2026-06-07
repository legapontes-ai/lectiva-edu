"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { planoSchema, type PlanoInput, STATUS_PLANO_VALUES } from "@/lib/validations/plano";
import { criarPlano } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type DisciplinaOpcao = { id: string; nome: string; idCurso: string; cursoNome: string | null };
export type TurmaOpcao = { id: string; nome: string; idCurso: string };

const STATUS_LABEL: Record<string, string> = {
  EmElaboracao: "Em elaboração",
  EmAndamento: "Em andamento",
  Concluido: "Concluído",
};

export function PlanoForm({
  disciplinas,
  turmas,
}: {
  disciplinas: DisciplinaOpcao[];
  turmas: TurmaOpcao[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanoInput>({
    resolver: zodResolver(planoSchema) as never,
    defaultValues: {
      idDisciplina: "",
      idTurma: "",
      objetivos: "",
      metodologia: "",
      status: "EmElaboracao",
    },
  });

  const idDisciplina = watch("idDisciplina");
  const cursoSelecionado = useMemo(
    () => disciplinas.find((d) => d.id === idDisciplina)?.idCurso ?? null,
    [disciplinas, idDisciplina],
  );
  const turmasFiltradas = useMemo(
    () => (cursoSelecionado ? turmas.filter((t) => t.idCurso === cursoSelecionado) : []),
    [turmas, cursoSelecionado],
  );

  async function onSubmit(values: PlanoInput) {
    setErro(null);
    const res = await criarPlano(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="Disciplina" htmlFor="idDisciplina" error={errors.idDisciplina?.message}>
        <Select
          id="idDisciplina"
          {...register("idDisciplina")}
          onChange={(e) => {
            setValue("idDisciplina", e.target.value, { shouldValidate: true });
            setValue("idTurma", "");
          }}
        >
          <option value="">— Selecione —</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
              {d.cursoNome ? ` (${d.cursoNome})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Turma"
        htmlFor="idTurma"
        error={errors.idTurma?.message}
        hint={!idDisciplina ? "Selecione uma disciplina primeiro." : undefined}
      >
        <Select id="idTurma" {...register("idTurma")} disabled={!idDisciplina}>
          <option value="">— Selecione —</option>
          {turmasFiltradas.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </Select>
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Select id="status" {...register("status")}>
          {STATUS_PLANO_VALUES.map((v) => (
            <option key={v} value={v}>{STATUS_LABEL[v]}</option>
          ))}
        </Select>
      </Field>

      <Field label="Objetivos" htmlFor="objetivos" error={errors.objetivos?.message}>
        <Textarea id="objetivos" {...register("objetivos")} placeholder="Objetivos de aprendizagem do plano." />
      </Field>

      <Field label="Metodologia" htmlFor="metodologia" error={errors.metodologia?.message}>
        <Textarea id="metodologia" {...register("metodologia")} placeholder="Estratégias e recursos didáticos." />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Criar plano
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
