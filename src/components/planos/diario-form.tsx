"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { diarioSchema, type DiarioInput } from "@/lib/validations/plano";
import { adicionarDiario } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DiarioForm({
  idPlano,
  aulas,
}: {
  idPlano: string;
  aulas: { id: string; titulo: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiarioInput>({
    resolver: zodResolver(diarioSchema) as never,
    defaultValues: { data: "", idAula: "", conteudoMinistrado: "", observacoes: "" },
  });

  async function onSubmit(values: DiarioInput) {
    setErro(null);
    const res = await adicionarDiario(idPlano, values);
    if (res?.erro) setErro(res.erro);
    else {
      reset({ data: "", idAula: "", conteudoMinistrado: "", observacoes: "" });
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor="diario-data" error={errors.data?.message}>
          <Input id="diario-data" type="date" {...register("data")} />
        </Field>
        <Field label="Aula (opcional)" htmlFor="diario-aula" error={errors.idAula?.message}>
          <Select id="diario-aula" {...register("idAula")}>
            <option value="">— Sem vínculo —</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>{a.titulo}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Conteúdo ministrado" htmlFor="diario-conteudo" error={errors.conteudoMinistrado?.message}>
        <Textarea id="diario-conteudo" {...register("conteudoMinistrado")} />
      </Field>
      <Field label="Observações" htmlFor="diario-obs" error={errors.observacoes?.message}>
        <Textarea id="diario-obs" {...register("observacoes")} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Registrar no diário
      </Button>
    </form>
  );
}
