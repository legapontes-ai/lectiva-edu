"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarCobranca } from "@/lib/financeiro/actions";

/** Gera (ou regenera) a cobrança de uma parcela no provedor de pagamento. */
export function GerarCobrancaButton({
  idParcela,
  temLink,
}: {
  idParcela: string;
  temLink: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const res = await gerarCobranca(idParcela);
      if (res?.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Barcode className="size-4" />}
      {temLink ? "Regerar cobrança" : "Gerar cobrança"}
    </Button>
  );
}
