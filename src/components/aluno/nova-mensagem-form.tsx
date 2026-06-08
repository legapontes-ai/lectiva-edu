"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { mensagemSchema, type MensagemInput, TIPO_MENSAGEM } from "@/lib/validations/mensagem";
import { enviarMensagem } from "@/lib/mensagens/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function NovaMensagemForm({ disciplinas }: { disciplinas: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MensagemInput>({
    resolver: zodResolver(mensagemSchema) as never,
    defaultValues: { tipo: "Mensagem", assunto: "", conteudo: "", idDisciplina: "" },
  });

  async function onSubmit(values: MensagemInput) {
    setErro(null);
    setOkMsg(false);
    const res = await enviarMensagem(values);
    if (res?.erro) {
      setErro(res.erro);
      return;
    }
    reset({ tipo: "Mensagem", assunto: "", conteudo: "", idDisciplina: "" });
    setOkMsg(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      {okMsg && (
        <div className="rounded-lg border border-green-soft bg-green-soft/40 px-3 py-2 text-sm text-[#1B7F2A]">
          Mensagem enviada. A equipe responderá em breve.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            {TIPO_MENSAGEM.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Disciplina (opcional)" htmlFor="idDisciplina" error={errors.idDisciplina?.message}>
          <Select id="idDisciplina" {...register("idDisciplina")}>
            <option value="">— Geral —</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Assunto (opcional)" htmlFor="assunto" error={errors.assunto?.message}>
        <Input id="assunto" {...register("assunto")} placeholder="Ex.: Dúvida sobre prazo de entrega" />
      </Field>

      <Field label="Mensagem" htmlFor="conteudo" error={errors.conteudo?.message}>
        <Textarea id="conteudo" rows={4} {...register("conteudo")} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Enviar
      </Button>
    </form>
  );
}
