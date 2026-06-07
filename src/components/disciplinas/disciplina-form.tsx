"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { disciplinaSchema, type DisciplinaInput } from "@/lib/validations/disciplina";
import { criarDisciplina, atualizarDisciplina } from "@/lib/disciplinas/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Opções de status (StatusDisciplina) — rótulos pt-BR locais. */
export const STATUS_DISCIPLINA = [
  { value: "Programada", label: "Programada" },
  { value: "EmAndamento", label: "Em andamento" },
  { value: "Concluida", label: "Concluída" },
] as const;

export type DisciplinaFormValues = Partial<DisciplinaInput> & { id?: string };

export function DisciplinaForm({
  disciplina,
  professores,
  modulos,
}: {
  disciplina?: DisciplinaFormValues;
  professores: { id: string; nome: string }[];
  modulos: { id: string; nome: string; cursoNome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DisciplinaInput>({
    resolver: zodResolver(disciplinaSchema) as never,
    defaultValues: {
      nome: disciplina?.nome ?? "",
      codigo: disciplina?.codigo ?? "",
      ementa: disciplina?.ementa ?? "",
      objetivos: disciplina?.objetivos ?? "",
      conteudoProgramatico: disciplina?.conteudoProgramatico ?? "",
      cargaHoraria: disciplina?.cargaHoraria,
      idProfessor: disciplina?.idProfessor ?? "",
      idModulo: disciplina?.idModulo ?? "",
      atividadesAvaliativas: disciplina?.atividadesAvaliativas ?? "",
      datasImportantes: disciplina?.datasImportantes ?? "",
      status: disciplina?.status ?? "Programada",
    },
  });

  async function onSubmit(values: DisciplinaInput) {
    setErro(null);
    const res = disciplina?.id
      ? await atualizarDisciplina(disciplina.id, values)
      : await criarDisciplina(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Field label="Nome da disciplina" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register("nome")} />
        </Field>
        <Field label="Código" htmlFor="codigo" error={errors.codigo?.message}>
          <Input id="codigo" {...register("codigo")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Carga horária (h)" htmlFor="cargaHoraria" error={errors.cargaHoraria?.message}>
          <Input id="cargaHoraria" type="number" min={1} {...register("cargaHoraria")} />
        </Field>
        <Field label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register("status")}>
            {STATUS_DISCIPLINA.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Professor(a)" htmlFor="idProfessor" error={errors.idProfessor?.message}>
          <Select id="idProfessor" {...register("idProfessor")}>
            <option value="">— Sem professor —</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Módulo / eixo" htmlFor="idModulo" error={errors.idModulo?.message}>
        <Select id="idModulo" {...register("idModulo")}>
          <option value="">— Sem módulo —</option>
          {modulos.map((m) => (
            <option key={m.id} value={m.id}>{m.cursoNome} — {m.nome}</option>
          ))}
        </Select>
      </Field>

      <Field label="Ementa" htmlFor="ementa" error={errors.ementa?.message}>
        <Textarea id="ementa" {...register("ementa")} />
      </Field>
      <Field label="Objetivos" htmlFor="objetivos" error={errors.objetivos?.message}>
        <Textarea id="objetivos" {...register("objetivos")} />
      </Field>
      <Field label="Conteúdo programático" htmlFor="conteudoProgramatico" error={errors.conteudoProgramatico?.message}>
        <Textarea id="conteudoProgramatico" {...register("conteudoProgramatico")} />
      </Field>
      <Field label="Atividades avaliativas" htmlFor="atividadesAvaliativas" error={errors.atividadesAvaliativas?.message}>
        <Textarea id="atividadesAvaliativas" {...register("atividadesAvaliativas")} />
      </Field>
      <Field label="Datas importantes" htmlFor="datasImportantes" error={errors.datasImportantes?.message}>
        <Textarea id="datasImportantes" {...register("datasImportantes")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {disciplina?.id ? "Salvar alterações" : "Criar disciplina"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
