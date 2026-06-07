"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { planoSchema, type PlanoInput } from "@/lib/financeiro/schema";
import { criarPlanoDeMatricula } from "@/lib/financeiro/actions";
import { formatarBRL } from "@/lib/format";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type MatriculaOpcao = {
  id: string;
  protocolo: string;
  aluno: string;
  curso: string;
  valorSugerido: number | null;
};

export function PlanoForm({ matriculas }: { matriculas: MatriculaOpcao[] }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanoInput>({
    resolver: zodResolver(planoSchema) as never,
    defaultValues: {
      idMatricula: "",
      valorTotal: undefined,
      numParcelas: 12,
      descontos: 0,
      diaVencimento: 10,
    },
  });

  function aoEscolherMatricula(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = matriculas.find((x) => x.id === e.target.value);
    if (m?.valorSugerido != null) {
      setValue("valorTotal", m.valorSugerido, { shouldValidate: true });
    }
  }

  async function onSubmit(values: PlanoInput) {
    setErro(null);
    const { idMatricula, ...rest } = values;
    const res = await criarPlanoDeMatricula(idMatricula, rest);
    if (res?.erro) setErro(res.erro);
  }

  if (matriculas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Não há matrículas sem plano de pagamento disponíveis.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="Matrícula" htmlFor="idMatricula" error={errors.idMatricula?.message}>
        <Select id="idMatricula" {...register("idMatricula", { onChange: aoEscolherMatricula })}>
          <option value="">— Selecione —</option>
          {matriculas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.protocolo} · {m.aluno} · {m.curso}
              {m.valorSugerido != null ? ` · ${formatarBRL(m.valorSugerido)}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Valor total (R$)" htmlFor="valorTotal" error={errors.valorTotal?.message}>
          <Input id="valorTotal" type="number" step="0.01" min={0} {...register("valorTotal")} />
        </Field>
        <Field label="Descontos (R$)" htmlFor="descontos" error={errors.descontos?.message}>
          <Input id="descontos" type="number" step="0.01" min={0} {...register("descontos")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nº de parcelas" htmlFor="numParcelas" error={errors.numParcelas?.message}>
          <Input id="numParcelas" type="number" min={1} max={120} {...register("numParcelas")} />
        </Field>
        <Field
          label="Dia de vencimento"
          htmlFor="diaVencimento"
          error={errors.diaVencimento?.message}
          hint="Dia do mês (1 a 28). A 1ª parcela vence no mês seguinte."
        >
          <Input id="diaVencimento" type="number" min={1} max={28} {...register("diaVencimento")} />
        </Field>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Gerar plano e parcelas
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
