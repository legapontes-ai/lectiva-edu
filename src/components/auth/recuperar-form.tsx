"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { solicitarResetSchema, type SolicitarResetInput } from "@/lib/validations/auth";
import { solicitarReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecuperarForm() {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SolicitarResetInput>({ resolver: zodResolver(solicitarResetSchema) });

  async function onSubmit(values: SolicitarResetInput) {
    const res = await solicitarReset(values);
    setMensagem(res.mensagem ?? res.erro ?? null);
  }

  if (mensagem) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {mensagem}
        </div>
        <Button variant="outline" className="w-full" render={<Link href="/login" />}>
          <ArrowLeft className="size-4" /> Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Enviar link de redefinição
      </Button>
      <Link href="/login" className="block text-center text-xs font-medium text-link hover:underline">
        Voltar ao login
      </Link>
    </form>
  );
}
