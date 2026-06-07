"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { turmaSchema, type TurmaInput } from "@/lib/validations/turma";
import { criarTurma, atualizarTurma } from "@/lib/turmas/actions";
import { SITUACAO_TURMA } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type TurmaFormValues = Partial<TurmaInput> & { id?: string };

export function TurmaForm({
  turma,
  cursos,
  coordenadores,
}: {
  turma?: TurmaFormValues;
  cursos: { id: string; nome: string }[];
  coordenadores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TurmaInput>({
    resolver: zodResolver(turmaSchema) as never,
    defaultValues: {
      nome: turma?.nome ?? "",
      idCurso: turma?.idCurso ?? cursos[0]?.id ?? "",
      anoPeriodo: turma?.anoPeriodo ?? "",
      situacao: turma?.situacao ?? "EmFormacao",
      dataInicio: turma?.dataInicio ?? "",
      dataTermino: turma?.dataTermino ?? "",
      idCoordenador: turma?.idCoordenador ?? "",
    },
  });

  async function onSubmit(values: TurmaInput) {
    setErro(null);
    const res = turma?.id ? await atualizarTurma(turma.id, values) : await criarTurma(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="Curso" htmlFor="idCurso" error={errors.idCurso?.message}>
        <Select id="idCurso" {...register("idCurso")}>
          {cursos.length === 0 && <option value="">— Cadastre um curso primeiro —</option>}
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome da turma" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register("nome")} placeholder="Ex.: MBA Gestão — Turma 2026.1" />
        </Field>
        <Field label="Ano/Período" htmlFor="anoPeriodo" error={errors.anoPeriodo?.message}>
          <Input id="anoPeriodo" {...register("anoPeriodo")} placeholder="2026.1" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Início" htmlFor="dataInicio" error={errors.dataInicio?.message}>
          <Input id="dataInicio" type="date" {...register("dataInicio")} />
        </Field>
        <Field label="Término" htmlFor="dataTermino" error={errors.dataTermino?.message}>
          <Input id="dataTermino" type="date" {...register("dataTermino")} />
        </Field>
        <Field label="Situação" htmlFor="situacao" error={errors.situacao?.message}>
          <Select id="situacao" {...register("situacao")}>
            {SITUACAO_TURMA.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Coordenador(a)" htmlFor="idCoordenador" error={errors.idCoordenador?.message}>
        <Select id="idCoordenador" {...register("idCoordenador")}>
          <option value="">— Sem coordenador —</option>
          {coordenadores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {turma?.id ? "Salvar alterações" : "Criar turma"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
