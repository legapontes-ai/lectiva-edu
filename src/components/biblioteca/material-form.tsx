"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  materialSchema,
  tipoUsaUrl,
  TIPO_MATERIAL,
  BIBLIOGRAFIA,
  NIVEL_ACESSO,
  type MaterialInput,
} from "@/lib/validations/material";
import {
  criarMaterial,
  atualizarMaterial,
  enviarArquivoMaterial,
} from "@/lib/biblioteca/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type MaterialFormValues = Partial<MaterialInput> & { id?: string };

export function MaterialForm({
  material,
  disciplinas,
}: {
  material?: MaterialFormValues;
  disciplinas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema) as never,
    defaultValues: {
      titulo: material?.titulo ?? "",
      tipo: material?.tipo ?? "Livro",
      autor: material?.autor ?? "",
      categoria: material?.categoria ?? "",
      idDisciplina: material?.idDisciplina ?? "",
      arquivoUrl: material?.arquivoUrl ?? "",
      bibliografia: material?.bibliografia,
      nivelAcesso: material?.nivelAcesso ?? "Restrito",
    },
  });

  const tipo = watch("tipo");
  const usaUrl = tipoUsaUrl(tipo);
  const arquivoExistente = material?.arquivoUrl ?? "";

  async function onSubmit(values: MaterialInput) {
    setErro(null);
    let arquivoUrl = values.arquivoUrl;

    if (!usaUrl) {
      const file = fileRef.current?.files?.[0];
      if (file && file.size > 0) {
        const fd = new FormData();
        fd.set("titulo", values.titulo);
        fd.set("arquivo", file);
        const up = await enviarArquivoMaterial(fd);
        if (up.erro) {
          setErro(up.erro);
          return;
        }
        arquivoUrl = up.path;
      } else if (!arquivoExistente) {
        setErro("Envie um arquivo (PDF ou Word) para este tipo de material.");
        return;
      }
    } else if (!arquivoUrl) {
      setErro("Informe a URL do material.");
      return;
    }

    const payload: MaterialInput = { ...values, arquivoUrl };
    const res = material?.id
      ? await atualizarMaterial(material.id, payload)
      : await criarMaterial(payload);
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
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            {TIPO_MATERIAL.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Autor(a)" htmlFor="autor" error={errors.autor?.message}>
          <Input id="autor" {...register("autor")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
          <Input id="categoria" {...register("categoria")} />
        </Field>
        <Field label="Disciplina" htmlFor="idDisciplina" error={errors.idDisciplina?.message}>
          <Select id="idDisciplina" {...register("idDisciplina")}>
            <option value="">— Sem disciplina —</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {usaUrl ? (
        <Field
          label="URL do material"
          htmlFor="arquivoUrl"
          error={errors.arquivoUrl?.message}
          hint="Endereço completo (https://...) do link ou vídeo."
        >
          <Input
            id="arquivoUrl"
            type="url"
            placeholder="https://"
            {...register("arquivoUrl")}
          />
        </Field>
      ) : (
        <Field
          label="Arquivo (PDF ou Word)"
          htmlFor="arquivo"
          hint={
            arquivoExistente
              ? "Já existe um arquivo enviado. Selecione outro apenas se quiser substituí-lo."
              : "Selecione o arquivo a ser enviado para a biblioteca."
          }
        >
          <Input
            id="arquivo"
            type="file"
            ref={fileRef}
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bibliografia" htmlFor="bibliografia" error={errors.bibliografia?.message}>
          <Select id="bibliografia" {...register("bibliografia")}>
            <option value="">— Não classificada —</option>
            {BIBLIOGRAFIA.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nível de acesso" htmlFor="nivelAcesso" error={errors.nivelAcesso?.message}>
          <Select id="nivelAcesso" {...register("nivelAcesso")}>
            {NIVEL_ACESSO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {material?.id ? "Salvar alterações" : "Cadastrar material"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
