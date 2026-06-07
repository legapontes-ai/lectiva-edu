"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { atividadeSchema, type AtividadeInput } from "@/lib/validations/plano";
import { criarAtividade } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AtividadeForm({ idPlano }: { idPlano: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AtividadeInput>({
    resolver: zodResolver(atividadeSchema) as never,
    defaultValues: { nome: "", peso: 1, escalaMax: 10, data: "" },
  });

  async function onSubmit(values: AtividadeInput) {
    setErro(null);
    const res = await criarAtividade(idPlano, values);
    if (res?.erro) setErro(res.erro);
    else {
      reset({ nome: "", peso: 1, escalaMax: 10, data: "" });
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
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_7rem_10rem] sm:items-end">
        <Field label="Nome da atividade" htmlFor="ativ-nome" error={errors.nome?.message}>
          <Input id="ativ-nome" {...register("nome")} placeholder="Ex.: Prova 1, Trabalho final" />
        </Field>
        <Field label="Peso" htmlFor="ativ-peso" error={errors.peso?.message}>
          <Input id="ativ-peso" type="number" step="0.5" min={0.5} {...register("peso")} />
        </Field>
        <Field label="Escala máx." htmlFor="ativ-escala" error={errors.escalaMax?.message}>
          <Input id="ativ-escala" type="number" step="0.5" min={1} {...register("escalaMax")} />
        </Field>
        <Field label="Data" htmlFor="ativ-data" error={errors.data?.message}>
          <Input id="ativ-data" type="date" {...register("data")} />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Adicionar atividade
      </Button>
    </form>
  );
}
