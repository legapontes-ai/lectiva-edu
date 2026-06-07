"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { criarUsuarioSchema, type CriarUsuarioInput } from "@/lib/validations/usuario";
import { criarUsuario } from "@/lib/usuarios/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";

export function NovoUsuarioForm({ perfis }: { perfis: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CriarUsuarioInput>({
    resolver: zodResolver(criarUsuarioSchema),
    defaultValues: { nome: "", email: "", senha: "", idPerfil: perfis[0]?.id ?? "" },
  });

  async function onSubmit(values: CriarUsuarioInput) {
    setErro(null);
    const res = await criarUsuario(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail (login)" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field label="Perfil de acesso" htmlFor="idPerfil" error={errors.idPerfil?.message}>
          <Select id="idPerfil" {...register("idPerfil")}>
            {perfis.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Senha provisória" htmlFor="senha" error={errors.senha?.message} hint="Mínimo 8 caracteres, com letra e número. O usuário pode redefini-la depois.">
        <PasswordInput id="senha" autoComplete="off" {...register("senha")} />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Criar usuário
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
