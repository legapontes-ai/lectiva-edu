"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/painel/field";
import { darBaixaParcela } from "@/lib/financeiro/actions";
import { FORMA_PAGAMENTO } from "@/lib/financeiro/constants";

/** Abre um painel inline para registrar o pagamento (baixa) de uma parcela. */
export function DarBaixaButton({ idParcela }: { idParcela: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [forma, setForma] = useState<string>(FORMA_PAGAMENTO[0].value);
  const [comprovante, setComprovante] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const res = await darBaixaParcela(idParcela, {
        forma,
        comprovante: comprovante || undefined,
      });
      if (res?.erro) {
        window.alert(res.erro);
      } else {
        setAberto(false);
        setComprovante("");
        router.refresh();
      }
    });
  }

  if (!aberto) {
    return (
      <Button type="button" size="sm" onClick={() => setAberto(true)}>
        <CheckCircle2 className="size-4" /> Dar baixa
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Forma de pagamento" htmlFor={`forma-${idParcela}`}>
          <Select
            id={`forma-${idParcela}`}
            value={forma}
            onChange={(e) => setForma(e.target.value)}
          >
            {FORMA_PAGAMENTO.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Comprovante (opcional)" htmlFor={`comp-${idParcela}`}>
          <Input
            id={`comp-${idParcela}`}
            placeholder="Referência / link"
            value={comprovante}
            onChange={(e) => setComprovante(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={confirmar} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Confirmar baixa
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)} disabled={pending}>
          <X className="size-4" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
