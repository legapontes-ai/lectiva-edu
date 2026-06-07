"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Alterna a situação de um comunicado (Publicado <-> Arquivado).
 * Recebe uma server action já vinculada (ex.: alternarSituacaoComunicado.bind(null, id)).
 */
export function SituacaoToggle({
  action,
  situacao,
}: {
  action: () => Promise<{ erro?: string }>;
  situacao: "Publicado" | "Arquivado";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const vaiArquivar = situacao === "Publicado";
  const label = vaiArquivar ? "Arquivar" : "Publicar";

  function handle() {
    startTransition(async () => {
      const res = await action();
      if (res?.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handle}
      disabled={pending}
      title={label}
      aria-label={label}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : vaiArquivar ? (
        <Archive className="size-4" />
      ) : (
        <Send className="size-4 text-success" />
      )}
    </Button>
  );
}
