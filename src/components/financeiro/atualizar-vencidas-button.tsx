"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { atualizarVencidas } from "@/lib/financeiro/actions";

/** Reprocessa parcelas em aberto vencidas, marcando-as como Vencida. */
export function AtualizarVencidasButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const res = await atualizarVencidas();
      if (res?.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Atualizar vencidas
    </Button>
  );
}
