"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baixarCertificado } from "@/lib/certificados/actions";

/**
 * Botão para o aluno baixar o PDF de um certificado. Chama a server action
 * baixarCertificado(id), que devolve uma URL assinada temporária, e abre o
 * arquivo em nova aba.
 */
export function BaixarCertificado({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handle() {
    setErro(null);
    startTransition(async () => {
      const res = await baixarCertificado(id);
      if (res.erro) {
        setErro(res.erro);
        window.alert(res.erro);
      } else if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Baixar PDF
      {erro ? <span className="sr-only">{erro}</span> : null}
    </Button>
  );
}
