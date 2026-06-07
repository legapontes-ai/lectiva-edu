"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { autocadastroSchema, type AutocadastroInput } from "@/lib/validations/autocadastro";
import { solicitarAutocadastro } from "@/lib/autocadastro/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AutocadastroForm({ perfis }: { perfis: { id: string; nome: string }[] }) {
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ senha: string; expira: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AutocadastroInput>({
    resolver: zodResolver(autocadastroSchema) as never,
    defaultValues: { nome: "", email: "", cpf: "", telefone: "", idPerfil: perfis[0]?.id ?? "" },
  });

  async function onSubmit(values: AutocadastroInput) {
    setErro(null);
    const res = await solicitarAutocadastro(values);
    if (res?.erro) setErro(res.erro);
    else if (res?.ok && res.senhaTemporaria)
      setSucesso({ senha: res.senhaTemporaria, expira: res.expiraEm ?? "" });
  }

  if (sucesso) {
    const dt = sucesso.expira ? new Date(sucesso.expira).toLocaleDateString("pt-BR") : "";
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-green-soft px-3 py-3 text-sm text-[#1B7F2A]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Solicitação enviada!</p>
            <p>Seu acesso ficará disponível após aprovação da administração.</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <p className="text-muted-foreground">Sua senha temporária (anote — você a trocará no 1º acesso):</p>
          <p className="mt-1 font-mono text-lg font-bold text-foreground">{sucesso.senha}</p>
          {dt && <p className="mt-1 text-xs text-muted-foreground">Válida até {dt}.</p>}
        </div>
        <Button variant="outline" className="w-full" render={<Link href="/login" />}>
          <ArrowLeft className="size-4" /> Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      <Field label="Perfil desejado" htmlFor="idPerfil" error={errors.idPerfil?.message}>
        <Select id="idPerfil" {...register("idPerfil")}>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </Select>
      </Field>
      <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" autoComplete="name" {...register("nome")} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
          <Input id="cpf" inputMode="numeric" placeholder="000.000.000-00" {...register("cpf")} />
        </Field>
        <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message}>
          <Input id="telefone" type="tel" {...register("telefone")} />
        </Field>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Solicitar cadastro
      </Button>
      <Link href="/login" className="block text-center text-xs font-medium text-link hover:underline">
        Já tenho conta — entrar
      </Link>
    </form>
  );
}
