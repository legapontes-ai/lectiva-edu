"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldOff, ShieldCheck } from "lucide-react";
import { revogarConsentimento, reativarConsentimento } from "@/lib/lgpd/actions";
import { Button } from "@/components/ui/button";

export function ConsentimentoAcoes({ id, ativo }: { id: string; ativo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function executar() {
    const msg = ativo
      ? "Revogar este consentimento? O titular deixará de ter o tratamento consentido ativo."
      : "Reativar este consentimento?";
    if (!window.confirm(msg)) return;
    start(async () => {
      const res = ativo ? await revogarConsentimento(id) : await reativarConsentimento(id);
      if (res?.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={executar} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : ativo ? (
        <ShieldOff className="size-4 text-destructive" />
      ) : (
        <ShieldCheck className="size-4 text-success" />
      )}
      {ativo ? "Revogar" : "Reativar"}
    </Button>
  );
}
