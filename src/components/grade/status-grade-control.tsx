"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { definirStatusGrade } from "@/lib/grade/actions";
import type { StatusGradeValue } from "@/lib/grade/schema";

export function StatusGradeControl({
  idGrade,
  status,
}: {
  idGrade: string;
  status: StatusGradeValue;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [, setErro] = useState<string | null>(null);

  function alterar(novo: StatusGradeValue) {
    setErro(null);
    startTransition(async () => {
      const res = await definirStatusGrade(idGrade, novo);
      if (res?.erro) {
        setErro(res.erro);
        window.alert(res.erro);
      } else {
        router.refresh();
      }
    });
  }

  if (status === "Publicada") {
    return <p className="text-xs text-muted-foreground">Grade publicada (somente leitura).</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {status === "EmElaboracao" && (
        <Button type="button" size="sm" variant="outline" onClick={() => alterar("Validada")} disabled={pending}>
          <CheckCircle2 className="size-4 text-success" /> Validar
        </Button>
      )}
      {status === "Validada" && (
        <>
          <Button type="button" size="sm" onClick={() => alterar("Publicada")} disabled={pending}>
            <Send className="size-4" /> Publicar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => alterar("EmElaboracao")} disabled={pending}>
            <Undo2 className="size-4" /> Reabrir
          </Button>
        </>
      )}
    </div>
  );
}
