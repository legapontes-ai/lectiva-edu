"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botão de exclusão com confirmação. Recebe uma server action já vinculada
 * (ex.: excluirCurso.bind(null, id)).
 */
export function DeleteButton({
  action,
  confirmacao = "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
  label = "Excluir",
}: {
  action: () => Promise<{ erro?: string }>;
  confirmacao?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handle() {
    if (!window.confirm(confirmacao)) return;
    setErro(null);
    startTransition(async () => {
      const res = await action();
      if (res?.erro) {
        setErro(res.erro);
        window.alert(res.erro);
      } else {
        router.refresh();
      }
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
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
      {erro ? <span className="sr-only">{erro}</span> : null}
    </Button>
  );
}
