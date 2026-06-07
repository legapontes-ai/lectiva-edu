"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  comunicadoSchema,
  type ComunicadoInput,
  PUBLICO_ALVO,
  URGENCIA,
} from "@/lib/validations/comunicado";
import { criarComunicado, atualizarComunicado } from "@/lib/comunicados/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ComunicadoFormValues = Partial<ComunicadoInput> & { id?: string };

export function ComunicadoForm({
  comunicado,
  turmas,
}: {
  comunicado?: ComunicadoFormValues;
  turmas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComunicadoInput>({
    resolver: zodResolver(comunicadoSchema) as never,
    defaultValues: {
      titulo: comunicado?.titulo ?? "",
      conteudo: comunicado?.conteudo ?? "",
      publicoAlvo: comunicado?.publicoAlvo ?? "Todos",
      idTurma: comunicado?.idTurma ?? "",
      urgencia: comunicado?.urgencia ?? "Normal",
    },
  });

  const publicoAlvo = watch("publicoAlvo");

  async function onSubmit(values: ComunicadoInput) {
    setErro(null);
    const res = comunicado?.id
      ? await atualizarComunicado(comunicado.id, values)
      : await criarComunicado(values);
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

      <Field label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" {...register("titulo")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Público-alvo" htmlFor="publicoAlvo" error={errors.publicoAlvo?.message}>
          <Select id="publicoAlvo" {...register("publicoAlvo")}>
            {PUBLICO_ALVO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Urgência" htmlFor="urgencia" error={errors.urgencia?.message}>
          <Select id="urgencia" {...register("urgencia")}>
            {URGENCIA.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {publicoAlvo === "Turma" && (
        <Field
          label="Turma de destino"
          htmlFor="idTurma"
          error={errors.idTurma?.message}
          hint="Obrigatório quando o público-alvo é uma turma específica."
        >
          <Select id="idTurma" {...register("idTurma")}>
            <option value="">— Selecione a turma —</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Conteúdo" htmlFor="conteudo" error={errors.conteudo?.message}>
        <Textarea id="conteudo" rows={8} {...register("conteudo")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {comunicado?.id ? "Salvar alterações" : "Publicar comunicado"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
