"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { novaSenhaSchema, type NovaSenhaInput } from "@/lib/validations/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function RedefinirForm() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [prontoParaRedefinir, setProntoParaRedefinir] = useState<boolean | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaInput>({ resolver: zodResolver(novaSenhaSchema) });

  useEffect(() => {
    // O link de recuperação cria uma sessão temporária (detectada na URL).
    supabase.auth.getSession().then(({ data }) => {
      setProntoParaRedefinir(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setProntoParaRedefinir(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(values: NovaSenhaInput) {
    setErroServidor(null);
    const { error } = await supabase.auth.updateUser({ password: values.senha });
    if (error) {
      setErroServidor("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login?redefinida=1");
  }

  if (prontoParaRedefinir === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Validando link…
      </div>
    );
  }

  if (!prontoParaRedefinir) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          Link inválido ou expirado. Solicite um novo link de redefinição.
        </div>
        <Button variant="outline" className="w-full" render={<Link href="/recuperar-senha" />}>
          Solicitar novo link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erroServidor && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {erroServidor}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="senha">Nova senha</Label>
        <PasswordInput id="senha" autoComplete="new-password" {...register("senha")} />
        {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmar">Confirmar nova senha</Label>
        <PasswordInput id="confirmar" autoComplete="new-password" {...register("confirmar")} />
        {errors.confirmar && <p className="text-xs text-destructive">{errors.confirmar.message}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Redefinir senha
      </Button>
    </form>
  );
}
