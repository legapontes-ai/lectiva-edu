"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, Ban, Loader2 } from "lucide-react";
import {
  baixarCertificado,
  cancelarCertificado,
  reemitirCertificado,
} from "@/lib/certificados/actions";
import { Button } from "@/components/ui/button";

export function CertificadoAcoes({
  id,
  situacao,
  temArquivo,
}: {
  id: string;
  situacao: string;
  temArquivo: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [baixando, setBaixando] = useState(false);

  function handleBaixar() {
    setBaixando(true);
    startTransition(async () => {
      const res = await baixarCertificado(id);
      setBaixando(false);
      if (res.erro) {
        window.alert(res.erro);
        return;
      }
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  function handleCancelar() {
    if (!window.confirm("Cancelar este certificado? Ele deixará de ser válido na consulta pública.")) {
      return;
    }
    startTransition(async () => {
      const res = await cancelarCertificado(id);
      if (res.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  function handleReemitir() {
    if (!window.confirm("Reemitir gera um novo certificado e marca o atual como reemitido. Continuar?")) {
      return;
    }
    startTransition(async () => {
      const res = await reemitirCertificado(id);
      if (res.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  const ativo = situacao === "Emitido";

  return (
    <div className="flex items-center justify-end gap-1">
      {temArquivo && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleBaixar}
          disabled={pending}
          title="Baixar PDF"
          aria-label="Baixar PDF"
        >
          {baixando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </Button>
      )}
      {ativo && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReemitir}
            disabled={pending}
            title="Reemitir"
            aria-label="Reemitir"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancelar}
            disabled={pending}
            title="Cancelar"
            aria-label="Cancelar"
          >
            <Ban className="size-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}
