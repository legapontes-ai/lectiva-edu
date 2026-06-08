"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { responderMensagem, atualizarStatusMensagem } from "@/lib/mensagens/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ResponderForm({
  id,
  respostaAtual,
  encerrada,
}: {
  id: string;
  respostaAtual: string | null;
  encerrada: boolean;
}) {
  const router = useRouter();
  const [resposta, setResposta] = useState(respostaAtual ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  async function responder() {
    setErro(null);
    setEnviando(true);
    const res = await responderMensagem(id, { resposta });
    setEnviando(false);
    if (res?.erro) setErro(res.erro);
    else router.refresh();
  }

  async function encerrar() {
    setErro(null);
    setEncerrando(true);
    const res = await atualizarStatusMensagem(id, "Encerrada");
    setEncerrando(false);
    if (res?.erro) setErro(res.erro);
    else router.refresh();
  }

  return (
    <div className="space-y-2">
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Textarea
        rows={3}
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Escreva a resposta ao aluno…"
        disabled={encerrada}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={responder} disabled={enviando || encerrada || !resposta.trim()}>
          {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Responder
        </Button>
        {!encerrada ? (
          <Button type="button" size="sm" variant="outline" onClick={encerrar} disabled={encerrando}>
            {encerrando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Encerrar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
