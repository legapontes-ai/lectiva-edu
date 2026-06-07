"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Paperclip } from "lucide-react";
import { adicionarMaterialAula } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Adiciona material a uma aula: anexo (upload) ou URL externa. */
export function MaterialForm({ idAula }: { idAula: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adicionarMaterialAula(idAula, formData);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título do material" htmlFor={`mat-titulo-${idAula}`}>
          <Input id={`mat-titulo-${idAula}`} name="titulo" required />
        </Field>
        <Field label="URL (opcional)" htmlFor={`mat-url-${idAula}`} hint="Informe uma URL ou anexe um arquivo.">
          <Input id={`mat-url-${idAula}`} name="arquivoUrl" type="url" placeholder="https://..." />
        </Field>
      </div>
      <Field label="Arquivo (opcional)" htmlFor={`mat-arq-${idAula}`}>
        <Input id={`mat-arq-${idAula}`} name="arquivo" type="file" />
      </Field>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        Anexar material
      </Button>
    </form>
  );
}
