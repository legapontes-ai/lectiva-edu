"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { aulaSchema, type AulaInput } from "@/lib/validations/plano";
import { adicionarAula, atualizarAula } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type AulaValores = {
  id: string;
  titulo: string;
  conteudo: string | null;
  objetivos: string | null;
  dataPrevista: string | null;
  cargaHoraria: number | null;
  ordem: number;
};

export function AulaForm({
  idPlano,
  aula,
  onDone,
  onCancel,
}: {
  idPlano?: string;
  aula?: AulaValores;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(aula);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AulaInput>({
    resolver: zodResolver(aulaSchema) as never,
    defaultValues: {
      titulo: aula?.titulo ?? "",
      conteudo: aula?.conteudo ?? "",
      objetivos: aula?.objetivos ?? "",
      dataPrevista: aula?.dataPrevista ?? "",
      cargaHoraria: aula?.cargaHoraria ?? undefined,
      ordem: aula?.ordem ?? undefined,
    },
  });

  async function onSubmit(values: AulaInput) {
    setErro(null);
    const res = aula ? await atualizarAula(aula.id, values) : await adicionarAula(idPlano!, values);
    if (res?.erro) {
      setErro(res.erro);
      return;
    }
    if (!editando) reset({ titulo: "", conteudo: "", objetivos: "", dataPrevista: "", cargaHoraria: undefined, ordem: undefined });
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_8rem]">
        <Field label="Título" htmlFor={`titulo-${aula?.id ?? "novo"}`} error={errors.titulo?.message}>
          <Input id={`titulo-${aula?.id ?? "novo"}`} {...register("titulo")} />
        </Field>
        <Field label="Ordem" htmlFor={`ordem-${aula?.id ?? "novo"}`} error={errors.ordem?.message}>
          <Input id={`ordem-${aula?.id ?? "novo"}`} type="number" min={1} placeholder="auto" {...register("ordem")} />
        </Field>
        <Field label="Carga horária (h)" htmlFor={`ch-${aula?.id ?? "novo"}`} error={errors.cargaHoraria?.message}>
          <Input id={`ch-${aula?.id ?? "novo"}`} type="number" min={0} {...register("cargaHoraria")} />
        </Field>
      </div>

      <Field label="Data prevista" htmlFor={`data-${aula?.id ?? "novo"}`} error={errors.dataPrevista?.message}>
        <Input id={`data-${aula?.id ?? "novo"}`} type="date" {...register("dataPrevista")} />
      </Field>

      <Field label="Conteúdo" htmlFor={`conteudo-${aula?.id ?? "novo"}`} error={errors.conteudo?.message}>
        <Textarea id={`conteudo-${aula?.id ?? "novo"}`} {...register("conteudo")} />
      </Field>

      <Field label="Objetivos da aula" htmlFor={`obj-${aula?.id ?? "novo"}`} error={errors.objetivos?.message}>
        <Textarea id={`obj-${aula?.id ?? "novo"}`} {...register("objetivos")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : !editando ? <Plus className="size-4" /> : null}
          {editando ? "Salvar aula" : "Adicionar aula"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
