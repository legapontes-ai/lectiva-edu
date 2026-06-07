"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { analiseSchema, type AnaliseInput } from "@/lib/validations/conformidade";
import { registrarAnalise } from "@/lib/conformidade/actions";
import { STATUS_CONFORMIDADE_OPCOES } from "@/lib/conformidade/status";
import type { StatusConformidade } from "@prisma/client";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AnaliseForm({
  idPlano,
  status,
  observacoes,
}: {
  idPlano: string;
  status: StatusConformidade;
  observacoes?: string | null;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnaliseInput>({
    resolver: zodResolver(analiseSchema) as never,
    defaultValues: {
      idPlano,
      status: status ?? "Pendente",
      observacoes: observacoes ?? "",
    },
  });

  async function onSubmit(values: AnaliseInput) {
    setErro(null);
    setSucesso(false);
    const res = await registrarAnalise(values);
    if (res?.erro) {
      setErro(res.erro);
    } else {
      setSucesso(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      {sucesso && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-green-soft px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" /> Análise registrada com sucesso.
        </div>
      )}

      <input type="hidden" {...register("idPlano")} />

      <Field label="Status da análise" htmlFor="status" error={errors.status?.message}>
        <Select id="status" {...register("status")}>
          {STATUS_CONFORMIDADE_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Observações"
        htmlFor="observacoes"
        error={errors.observacoes?.message}
        hint="Aponte ajustes necessários ou justifique a conformidade."
      >
        <Textarea id="observacoes" rows={4} {...register("observacoes")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Registrar análise
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/painel/conformidade")}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
