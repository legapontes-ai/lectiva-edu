"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { ocorrenciaSchema, type OcorrenciaInput } from "@/lib/validations/plano";
import { adicionarOcorrencia } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function OcorrenciaForm({
  idPlano,
  alunos,
  aulas,
}: {
  idPlano: string;
  alunos: { id: string; nome: string }[];
  aulas: { id: string; titulo: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OcorrenciaInput>({
    resolver: zodResolver(ocorrenciaSchema) as never,
    defaultValues: { idAluno: "", tipo: "", descricao: "", data: "", idAula: "" },
  });

  async function onSubmit(values: OcorrenciaInput) {
    setErro(null);
    const res = await adicionarOcorrencia(idPlano, values);
    if (res?.erro) setErro(res.erro);
    else {
      reset({ idAluno: "", tipo: "", descricao: "", data: "", idAula: "" });
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
        <Field label="Aluno" htmlFor="oc-aluno" error={errors.idAluno?.message}>
          <Select id="oc-aluno" {...register("idAluno")}>
            <option value="">— Selecione —</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data" htmlFor="oc-data" error={errors.data?.message}>
          <Input id="oc-data" type="date" {...register("data")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo (opcional)" htmlFor="oc-tipo" error={errors.tipo?.message}>
          <Input id="oc-tipo" {...register("tipo")} placeholder="Ex.: Comportamental, Pedagógica" />
        </Field>
        <Field label="Aula (opcional)" htmlFor="oc-aula" error={errors.idAula?.message}>
          <Select id="oc-aula" {...register("idAula")}>
            <option value="">— Sem vínculo —</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>{a.titulo}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Descrição" htmlFor="oc-desc" error={errors.descricao?.message}>
        <Textarea id="oc-desc" {...register("descricao")} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Registrar ocorrência
      </Button>
    </form>
  );
}
