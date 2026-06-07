"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { trocarSenhaSchema, type TrocarSenhaInput } from "@/lib/validations/autocadastro";
import { finalizarTrocaSenha } from "@/lib/autocadastro/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export function TrocarSenhaForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrocarSenhaInput>({ resolver: zodResolver(trocarSenhaSchema) as never });

  async function onSubmit(values: TrocarSenhaInput) {
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: values.senha });
    if (error) {
      setErro("Não foi possível definir a nova senha. Tente novamente.");
      return;
    }
    await finalizarTrocaSenha();
    router.push(destino);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      <Field label="Nova senha" htmlFor="senha" error={errors.senha?.message}>
        <PasswordInput id="senha" autoComplete="new-password" {...register("senha")} />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="confirmar" error={errors.confirmar?.message}>
        <PasswordInput id="confirmar" autoComplete="new-password" {...register("confirmar")} />
      </Field>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Definir senha e continuar
      </Button>
    </form>
  );
}
