"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { criarVersaoGrade } from "@/lib/grade/actions";

export function CriarVersaoButton({
  idCurso,
  label = "Nova versão",
}: {
  idCurso: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handle() {
    setErro(null);
    startTransition(async () => {
      const res = await criarVersaoGrade(idCurso);
      if (res?.erro) {
        setErro(res.erro);
        window.alert(res.erro);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button type="button" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      {label}
      {erro ? <span className="sr-only">{erro}</span> : null}
    </Button>
  );
}
