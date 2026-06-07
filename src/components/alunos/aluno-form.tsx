"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { criarAlunoSchema, editarAlunoSchema, type CriarAlunoInput } from "@/lib/validations/aluno";
import { criarAluno, atualizarAluno } from "@/lib/alunos/actions";
import { SITUACAO_ACADEMICA } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type AlunoFormValues = Partial<CriarAlunoInput> & { id?: string };

export function AlunoForm({ aluno }: { aluno?: AlunoFormValues }) {
  const router = useRouter();
  const isNovo = !aluno?.id;
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CriarAlunoInput>({
    resolver: zodResolver(isNovo ? criarAlunoSchema : editarAlunoSchema) as never,
    defaultValues: {
      nome: aluno?.nome ?? "",
      email: aluno?.email ?? "",
      senha: "",
      cpf: aluno?.cpf ?? "",
      rg: aluno?.rg ?? "",
      dataNascimento: aluno?.dataNascimento ?? "",
      telefone: aluno?.telefone ?? "",
      endereco: aluno?.endereco ?? "",
      situacaoAcademica: aluno?.situacaoAcademica ?? "Ativo",
    },
  });

  async function onSubmit(values: CriarAlunoInput) {
    setErro(null);
    const res = isNovo ? await criarAluno(values) : await atualizarAluno(aluno!.id!, values);
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
        <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register("nome")} />
        </Field>
        <Field label="Situação acadêmica" htmlFor="situacaoAcademica" error={errors.situacaoAcademica?.message}>
          <Select id="situacaoAcademica" {...register("situacaoAcademica")}>
            {SITUACAO_ACADEMICA.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {isNovo && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-mail (login)" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>
          <Field label="Senha provisória" htmlFor="senha" error={errors.senha?.message} hint="Mín. 8 caracteres, com letra e número.">
            <PasswordInput id="senha" autoComplete="off" {...register("senha")} />
          </Field>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
          <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
        </Field>
        <Field label="RG" htmlFor="rg" error={errors.rg?.message}>
          <Input id="rg" {...register("rg")} />
        </Field>
        <Field label="Data de nascimento" htmlFor="dataNascimento" error={errors.dataNascimento?.message}>
          <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
        </Field>
      </div>

      <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message}>
        <Input id="telefone" {...register("telefone")} />
      </Field>
      <Field label="Endereço" htmlFor="endereco" error={errors.endereco?.message}>
        <Textarea id="endereco" {...register("endereco")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isNovo ? "Cadastrar aluno" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
