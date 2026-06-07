"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";
import { definirPoliticaSenha } from "@/lib/autocadastro/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Linha = { id: string; nome: string; dias: number };

function LinhaPolitica({ perfil }: { perfil: Linha }) {
  const router = useRouter();
  const [dias, setDias] = useState(perfil.dias);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function salvar() {
    setOk(false);
    start(async () => {
      const r = await definirPoliticaSenha({ idPerfil: perfil.id, diasValidade: dias });
      if (r?.erro) window.alert(r.erro);
      else {
        setOk(true);
        router.refresh();
      }
    });
  }

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 font-medium text-foreground">{perfil.nome}</td>
      <td className="px-4 py-3">
        <Input
          type="number"
          min={1}
          max={365}
          value={dias}
          onChange={(e) => {
            setOk(false);
            setDias(Number(e.target.value));
          }}
          className="h-9 w-24"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <Button type="button" size="sm" variant="consulta" onClick={salvar} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : ok ? <Check className="size-4" /> : <Save className="size-4" />}
          {ok ? "Salvo" : "Salvar"}
        </Button>
      </td>
    </tr>
  );
}

export function PoliticaSenhaTabela({ perfis }: { perfis: Linha[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Perfil</th>
            <th className="px-4 py-3 font-semibold">Validade (dias)</th>
            <th className="px-4 py-3 font-semibold text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {perfis.map((p) => (
            <LinhaPolitica key={p.id} perfil={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
