"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus, Trash2, CalendarRange } from "lucide-react";
import {
  novoPlanoSchema,
  type NovoPlanoInput,
  PERIODICIDADE,
  AULAS_POR_PERIODO,
} from "@/lib/validations/plano";
import { criarPlano } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type DisciplinaOpcao = { id: string; nome: string; idCurso: string; cursoNome: string | null };
export type TurmaOpcao = { id: string; nome: string; idCurso: string };

const AULA_VAZIA = { titulo: "", conteudo: "", dataPrevista: "", cargaHoraria: undefined };

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<NovoPlanoInput>({
    resolver: zodResolver(novoPlanoSchema) as never,
    defaultValues: {
      idDisciplina: "",
      idTurma: "",
      periodicidade: "",
      dataInicio: "",
      objetivos: "",
      metodologia: "",
      aulas: [{ ...AULA_VAZIA }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "aulas" });

  const idDisciplina = watch("idDisciplina");
  const cursoSelecionado = useMemo(
    () => disciplinas.find((d) => d.id === idDisciplina)?.idCurso ?? null,
    [disciplinas, idDisciplina],
  );
  const turmasFiltradas = useMemo(
    () => (cursoSelecionado ? turmas.filter((t) => t.idCurso === cursoSelecionado) : []),
    [turmas, cursoSelecionado],
  );

  function gerarDatas() {
    setErro(null);
    const per = watch("periodicidade");
    const inicio = watch("dataInicio");
    if (!inicio) {
      setErro("Informe a data de início para gerar o cronograma.");
      return;
    }
    const n = AULAS_POR_PERIODO[per || ""] ?? 4;
    const base = new Date(`${inicio}T00:00:00`);
    const novas = Array.from({ length: n }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i * 7); // 1 aula por semana
      return { titulo: `Aula ${i + 1}`, conteudo: "", dataPrevista: d.toISOString().slice(0, 10), cargaHoraria: undefined };
    });
    replace(novas);
  }

  async function onSubmit(values: NovoPlanoInput) {
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

      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Periodicidade do plano" htmlFor="periodicidade" hint="Mensal, bimestral, semestral ou anual.">
          <Select id="periodicidade" {...register("periodicidade")}>
            <option value="">— Não definida —</option>
            {PERIODICIDADE.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data de início" htmlFor="dataInicio">
          <Input id="dataInicio" type="date" {...register("dataInicio")} />
        </Field>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Cronograma de aulas</p>
          <div className="flex gap-2">
            <Button type="button" variant="consulta" size="sm" onClick={gerarDatas}>
              <CalendarRange className="size-4" /> Gerar datas
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => append({ ...AULA_VAZIA })}>
              <Plus className="size-4" /> Adicionar aula
            </Button>
          </div>
        </div>
        {errors.aulas?.message && <p className="mt-2 text-xs text-destructive">{errors.aulas.message}</p>}

        <div className="mt-4 space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="grid items-start gap-2 sm:grid-cols-[2fr_1.4fr_7rem_2.5rem]">
              <div>
                <Input
                  placeholder={`Aula ${i + 1} — título`}
                  aria-label={`Título da aula ${i + 1}`}
                  {...register(`aulas.${i}.titulo` as const)}
                />
                {errors.aulas?.[i]?.titulo && (
                  <p className="mt-1 text-xs text-destructive">{errors.aulas[i]?.titulo?.message}</p>
                )}
                <Textarea
                  className="mt-2 min-h-12"
                  placeholder="Matéria / conteúdo da aula"
                  aria-label={`Matéria da aula ${i + 1}`}
                  {...register(`aulas.${i}.conteudo` as const)}
                />
              </div>
              <Input type="date" aria-label={`Data da aula ${i + 1}`} {...register(`aulas.${i}.dataPrevista` as const)} />
              <Input type="number" min={0} placeholder="CH" aria-label={`Carga horária da aula ${i + 1}`} {...register(`aulas.${i}.cargaHoraria` as const)} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                title="Remover aula"
                aria-label="Remover aula"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

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
