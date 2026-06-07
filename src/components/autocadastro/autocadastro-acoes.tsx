"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, KeyRound } from "lucide-react";
import {
  aprovarAutocadastro,
  rejeitarAutocadastro,
  reenviarSenhaTemporaria,
} from "@/lib/autocadastro/actions";
import { Button } from "@/components/ui/button";

export function AutocadastroAcoes({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const pendente = status === "Pendente";

  function aprovar() {
    if (!window.confirm("Aprovar este autocadastro e ativar o acesso?")) return;
    start(async () => {
      const r = await aprovarAutocadastro(id);
      if (r?.erro) window.alert(r.erro);
      else router.refresh();
    });
  }
  function rejeitar() {
    const motivo = window.prompt("Motivo da rejeição (opcional):") ?? "";
    if (motivo === null) return;
    start(async () => {
      const r = await rejeitarAutocadastro(id, motivo);
      if (r?.erro) window.alert(r.erro);
      else router.refresh();
    });
  }
  function reenviar() {
    if (!window.confirm("Gerar uma nova senha temporária e renovar o prazo?")) return;
    start(async () => {
      const r = await reenviarSenhaTemporaria(id);
      if (r?.erro) window.alert(r.erro);
      else {
        window.alert(`Nova senha temporária: ${r.senhaTemporaria}\nInforme ao usuário com segurança.`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {pendente && (
        <>
          <Button type="button" variant="consulta" size="sm" onClick={aprovar} disabled={pending}>
            <Check className="size-4" /> Aprovar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={rejeitar} disabled={pending}>
            <X className="size-4 text-destructive" /> Rejeitar
          </Button>
        </>
      )}
      <Button type="button" variant="ghost" size="icon-sm" onClick={reenviar} disabled={pending} title="Reenviar senha temporária">
        <KeyRound className="size-4" />
      </Button>
    </div>
  );
}
