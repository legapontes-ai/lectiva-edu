"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { professorSchema, type ProfessorInput } from "@/lib/validations/professor";
import { criarProfessor, atualizarProfessor } from "@/lib/professores/actions";
import { SITUACAO_PROFESSOR } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ProfessorFormValues = Partial<ProfessorInput> & { id?: string };

export function ProfessorForm({ professor }: { professor?: ProfessorFormValues }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfessorInput>({
    resolver: zodResolver(professorSchema) as never,
    defaultValues: {
      nome: professor?.nome ?? "",
      situacao: professor?.situacao ?? "Ativo",
      email: professor?.email ?? "",
      cpf: professor?.cpf ?? "",
      telefone: professor?.telefone ?? "",
      titulacao: professor?.titulacao ?? "",
      areaAtuacao: professor?.areaAtuacao ?? "",
      lattes: professor?.lattes ?? "",
      miniCurriculo: professor?.miniCurriculo ?? "",
    },
  });

  async function onSubmit(values: ProfessorInput) {
    setErro(null);
    const res = professor?.id ? await atualizarProfessor(professor.id, values) : await criarProfessor(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register("nome")} />
        </Field>
        <Field label="Situação" htmlFor="situacao" error={errors.situacao?.message}>
          <Select id="situacao" {...register("situacao")}>
            {SITUACAO_PROFESSOR.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
          <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message}>
          <Input id="telefone" {...register("telefone")} />
        </Field>
        <Field label="Titulação" htmlFor="titulacao" error={errors.titulacao?.message}>
          <Input id="titulacao" {...register("titulacao")} placeholder="Doutor(a) em…" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Área de atuação" htmlFor="areaAtuacao" error={errors.areaAtuacao?.message}>
          <Input id="areaAtuacao" {...register("areaAtuacao")} />
        </Field>
        <Field label="Currículo Lattes (URL)" htmlFor="lattes" error={errors.lattes?.message}>
          <Input id="lattes" {...register("lattes")} placeholder="http://lattes.cnpq.br/…" />
        </Field>
      </div>

      <Field label="Mini currículo" htmlFor="miniCurriculo" error={errors.miniCurriculo?.message}>
        <Textarea id="miniCurriculo" {...register("miniCurriculo")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {professor?.id ? "Salvar alterações" : "Cadastrar docente"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
