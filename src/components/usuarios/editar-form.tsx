"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { editarUsuarioSchema, type EditarUsuarioInput } from "@/lib/validations/usuario";
import { atualizarUsuario } from "@/lib/usuarios/actions";
import { SITUACAO_USUARIO } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function EditarUsuarioForm({
  id,
  email,
  defaultValues,
  perfis,
}: {
  id: string;
  email: string;
  defaultValues: EditarUsuarioInput;
  perfis: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditarUsuarioInput>({ resolver: zodResolver(editarUsuarioSchema), defaultValues });

  async function onSubmit(values: EditarUsuarioInput) {
    setErro(null);
    const res = await atualizarUsuario(id, values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      <Field label="E-mail (login)">
        <Input value={email} disabled readOnly />
      </Field>
      <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Perfil de acesso" htmlFor="idPerfil" error={errors.idPerfil?.message}>
          <Select id="idPerfil" {...register("idPerfil")}>
            {perfis.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Situação" htmlFor="situacao" error={errors.situacao?.message}>
          <Select id="situacao" {...register("situacao")}>
            {SITUACAO_USUARIO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
