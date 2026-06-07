"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { eventoSchema, type EventoInput, TIPO_EVENTO, MODALIDADE_EVENTO } from "@/lib/validations/evento";
import { criarEvento, atualizarEvento } from "@/lib/calendario/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type EventoFormValues = Partial<EventoInput> & { id?: string };

export function EventoForm({
  evento,
  turmas,
  disciplinas,
}: {
  evento?: EventoFormValues;
  turmas: { id: string; label: string }[];
  disciplinas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventoInput>({
    resolver: zodResolver(eventoSchema) as never,
    defaultValues: {
      titulo: evento?.titulo ?? "",
      tipo: evento?.tipo ?? "Aula",
      modalidade: evento?.modalidade ?? "Presencial",
      dataInicio: evento?.dataInicio ?? "",
      dataFim: evento?.dataFim ?? "",
      idTurma: evento?.idTurma ?? "",
      idDisciplina: evento?.idDisciplina ?? "",
      descricao: evento?.descricao ?? "",
      notificar: evento?.notificar ?? false,
    },
  });

  async function onSubmit(values: EventoInput) {
    setErro(null);
    const res = evento?.id ? await atualizarEvento(evento.id, values) : await criarEvento(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" {...register("titulo")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            {TIPO_EVENTO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Modalidade" htmlFor="modalidade" error={errors.modalidade?.message}>
          <Select id="modalidade" {...register("modalidade")}>
            {MODALIDADE_EVENTO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Início" htmlFor="dataInicio" error={errors.dataInicio?.message}>
          <Input id="dataInicio" type="datetime-local" {...register("dataInicio")} />
        </Field>
        <Field label="Término (opcional)" htmlFor="dataFim" error={errors.dataFim?.message}>
          <Input id="dataFim" type="datetime-local" {...register("dataFim")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Turma (opcional)" htmlFor="idTurma" error={errors.idTurma?.message}>
          <Select id="idTurma" {...register("idTurma")}>
            <option value="">— Todas as turmas —</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Disciplina (opcional)" htmlFor="idDisciplina" error={errors.idDisciplina?.message}>
          <Select id="idDisciplina" {...register("idDisciplina")}>
            <option value="">— Nenhuma —</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
        <Textarea id="descricao" {...register("descricao")} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-foreground" htmlFor="notificar">
        <input
          id="notificar"
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          {...register("notificar")}
        />
        <Label htmlFor="notificar" className="cursor-pointer">Notificar participantes</Label>
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {evento?.id ? "Salvar alterações" : "Criar evento"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
