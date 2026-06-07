"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  modeloCertificadoSchema,
  type ModeloCertificadoInput,
  TIPO_CERTIFICADO,
  SITUACAO_MODELO_CERTIFICADO,
} from "@/lib/validations/certificado";
import { criarModelo, atualizarModelo } from "@/lib/certificados/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ModeloFormValues = Partial<ModeloCertificadoInput> & { id?: string };

export function ModeloCertificadoForm({ modelo }: { modelo?: ModeloFormValues }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModeloCertificadoInput>({
    resolver: zodResolver(modeloCertificadoSchema) as never,
    defaultValues: {
      nome: modelo?.nome ?? "",
      tipo: modelo?.tipo ?? "Conclusao",
      situacao: modelo?.situacao ?? "Ativo",
      layout: modelo?.layout ?? "",
      textoPadrao: modelo?.textoPadrao ?? "",
      requisitos: modelo?.requisitos ?? "",
    },
  });

  async function onSubmit(values: ModeloCertificadoInput) {
    setErro(null);
    const res = modelo?.id
      ? await atualizarModelo(modelo.id, values)
      : await criarModelo(values);
    if (res?.erro) setErro(res.erro);
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

      <Field label="Nome do modelo" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            {TIPO_CERTIFICADO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Situação" htmlFor="situacao" error={errors.situacao?.message}>
          <Select id="situacao" {...register("situacao")}>
            {SITUACAO_MODELO_CERTIFICADO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Texto padrão"
        htmlFor="textoPadrao"
        error={errors.textoPadrao?.message}
        hint="Texto que aparece no corpo do certificado. Se vazio, um texto padrão é usado."
      >
        <Textarea id="textoPadrao" {...register("textoPadrao")} />
      </Field>

      <Field
        label="Requisitos"
        htmlFor="requisitos"
        error={errors.requisitos?.message}
        hint="Descrição dos requisitos para emissão (apenas informativo)."
      >
        <Textarea id="requisitos" {...register("requisitos")} />
      </Field>

      <Field
        label="Layout"
        htmlFor="layout"
        error={errors.layout?.message}
        hint="Identificador de layout opcional."
      >
        <Input id="layout" {...register("layout")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {modelo?.id ? "Salvar alterações" : "Criar modelo"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
