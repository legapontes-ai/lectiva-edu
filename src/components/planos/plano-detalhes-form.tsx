"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  planoDetalhesSchema,
  type PlanoDetalhesInput,
  STATUS_PLANO_VALUES,
  type StatusPlanoValue,
} from "@/lib/validations/plano";
import { atualizarPlano } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_LABEL: Record<string, string> = {
  EmElaboracao: "Em elaboração",
  EmAndamento: "Em andamento",
  Concluido: "Concluído",
};

export function PlanoDetalhesForm({
  idPlano,
  objetivos,
  metodologia,
  status,
}: {
  idPlano: string;
  objetivos: string;
  metodologia: string;
  status: StatusPlanoValue;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanoDetalhesInput>({
    resolver: zodResolver(planoDetalhesSchema) as never,
    defaultValues: { objetivos, metodologia, status },
  });

  async function onSubmit(values: PlanoDetalhesInput) {
    setErro(null);
    setSalvo(false);
    const res = await atualizarPlano(idPlano, values);
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
          <CheckCircle2 className="size-4 shrink-0" /> Plano atualizado.
        </div>
      )}

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Select id="status" {...register("status")}>
          {STATUS_PLANO_VALUES.map((v) => (
            <option key={v} value={v}>{STATUS_LABEL[v]}</option>
          ))}
        </Select>
      </Field>

      <Field label="Objetivos" htmlFor="objetivos" error={errors.objetivos?.message}>
        <Textarea id="objetivos" rows={4} {...register("objetivos")} />
      </Field>

      <Field label="Metodologia" htmlFor="metodologia" error={errors.metodologia?.message}>
        <Textarea id="metodologia" rows={4} {...register("metodologia")} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  );
}
