"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck, AlertCircle, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Factor = { id: string; friendly_name?: string | null; status: string };

export function MfaManager() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [carregando, setCarregando] = useState(true);
  const [fatores, setFatores] = useState<Factor[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // estado de enrollment
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) setErro(error.message);
    else setFatores((data?.totp ?? []) as Factor[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    // Carregamento inicial dos fatores (setState ocorre de forma assíncrona).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  async function iniciarEnroll() {
    setErro(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `TOTP ${Date.now()}` });
    if (error || !data) {
      setErro(error?.message ?? "Falha ao iniciar o MFA.");
      return;
    }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmar() {
    if (!enroll) return;
    setVerificando(true);
    setErro(null);
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (e1 || !ch) {
      setErro(e1?.message ?? "Falha ao desafiar o fator.");
      setVerificando(false);
      return;
    }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: enroll.factorId, challengeId: ch.id, code: codigo.trim() });
    if (e2) {
      setErro("Código inválido. Tente novamente.");
      setVerificando(false);
      return;
    }
    setEnroll(null);
    setCodigo("");
    setVerificando(false);
    await carregar();
  }

  async function remover(factorId: string) {
    if (!window.confirm("Remover este fator de autenticação?")) return;
    setErro(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) setErro(error.message);
    await carregar();
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando…
      </div>
    );
  }

  const ativos = fatores.filter((f) => f.status === "verified");

  return (
    <div className="space-y-5">
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      {ativos.length > 0 && (
        <div className="space-y-2">
          {ativos.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-success">
                <ShieldCheck className="size-4" /> Autenticação em duas etapas ativa
              </span>
              <Button variant="ghost" size="sm" onClick={() => remover(f.id)}>
                <Trash2 className="size-4 text-destructive" /> Remover
              </Button>
            </div>
          ))}
        </div>
      )}

      {!enroll && ativos.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Proteja sua conta com um aplicativo autenticador (Google Authenticator, Authy, etc.).
            Recomendado especialmente para administradores.
          </p>
          <Button onClick={iniciarEnroll}>
            <ShieldCheck className="size-4" /> Ativar MFA (TOTP)
          </Button>
        </div>
      )}

      {enroll && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">
            1. Escaneie o QR code no seu aplicativo autenticador (ou informe a chave manualmente).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="QR Code do MFA" className="size-44 rounded-lg border border-border bg-white p-2" />
          <p className="text-xs text-muted-foreground">
            Chave manual: <code className="rounded bg-card px-1.5 py-0.5 font-mono">{enroll.secret}</code>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="codigo">2. Digite o código de 6 dígitos</Label>
            <Input
              id="codigo"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="max-w-40 tracking-widest"
              placeholder="000000"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={confirmar} disabled={verificando || codigo.length < 6}>
              {verificando && <Loader2 className="size-4 animate-spin" />} Confirmar
            </Button>
            <Button variant="ghost" onClick={() => setEnroll(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
