"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { removerDisciplinaGrade, recalcularCH } from "@/lib/grade/actions";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type GradeItem = {
  idDisciplina: string;
  nome: string;
  codigo: string | null;
  cargaHoraria: number;
  periodo: number | null;
  preRequisito: string | null;
};

const SEM_PERIODO = "__sem__";

export function GradeDisciplinasTabela({
  idGrade,
  itens,
  editavel,
}: {
  idGrade: string;
  itens: GradeItem[];
  editavel: boolean;
}) {
  const router = useRouter();
  const [recalculando, startRecalc] = useTransition();
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const periodosDisponiveis = useMemo(() => {
    const set = new Set<number>();
    let temSem = false;
    for (const i of itens) {
      if (i.periodo == null) temSem = true;
      else set.add(i.periodo);
    }
    return { numeros: [...set].sort((a, b) => a - b), temSem };
  }, [itens]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (filtroPeriodo === SEM_PERIODO && i.periodo != null) return false;
      if (filtroPeriodo !== "todos" && filtroPeriodo !== SEM_PERIODO && String(i.periodo) !== filtroPeriodo) return false;
      if (termo && !`${i.codigo ?? ""} ${i.nome}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [itens, filtroPeriodo, busca]);

  // Agrupa por período (null por último).
  const grupos = useMemo(() => {
    const mapa = new Map<string, GradeItem[]>();
    for (const i of filtrados) {
      const chave = i.periodo == null ? SEM_PERIODO : String(i.periodo);
      const lista = mapa.get(chave) ?? [];
      lista.push(i);
      mapa.set(chave, lista);
    }
    return [...mapa.entries()].sort(([a], [b]) => {
      if (a === SEM_PERIODO) return 1;
      if (b === SEM_PERIODO) return -1;
      return Number(a) - Number(b);
    });
  }, [filtrados]);

  function recalcular() {
    startRecalc(async () => {
      const res = await recalcularCH(idGrade);
      if (res?.erro) window.alert(res.erro);
      else router.refresh();
    });
  }

  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma disciplina nesta grade.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label htmlFor={`fp-${idGrade}`} className="mb-1 block text-xs font-medium text-muted-foreground">
            Período
          </label>
          <Select id={`fp-${idGrade}`} value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
            <option value="todos">Todos</option>
            {periodosDisponiveis.numeros.map((p) => (
              <option key={p} value={String(p)}>{`${p}º período`}</option>
            ))}
            {periodosDisponiveis.temSem && <option value={SEM_PERIODO}>Sem período</option>}
          </Select>
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor={`fb-${idGrade}`} className="mb-1 block text-xs font-medium text-muted-foreground">
            Buscar disciplina
          </label>
          <Input
            id={`fb-${idGrade}`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou código"
          />
        </div>
        {editavel && (
          <Button type="button" variant="outline" size="sm" onClick={recalcular} disabled={recalculando}>
            {recalculando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Recalcular CH
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Disciplina</th>
              <th className="px-4 py-2.5 font-semibold">CH</th>
              <th className="px-4 py-2.5 font-semibold">Pré-requisito</th>
              {editavel && <th className="px-4 py-2.5 text-right font-semibold">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grupos.length === 0 && (
              <tr>
                <td colSpan={editavel ? 4 : 3} className="px-4 py-4 text-center text-muted-foreground">
                  Nenhuma disciplina para os filtros aplicados.
                </td>
              </tr>
            )}
            {grupos.map(([chave, lista]) => (
              <GrupoPeriodo
                key={chave}
                titulo={chave === SEM_PERIODO ? "Sem período" : `${chave}º período`}
                lista={lista}
                idGrade={idGrade}
                editavel={editavel}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrupoPeriodo({
  titulo,
  lista,
  idGrade,
  editavel,
}: {
  titulo: string;
  lista: GradeItem[];
  idGrade: string;
  editavel: boolean;
}) {
  const subtotal = lista.reduce((s, i) => s + i.cargaHoraria, 0);
  return (
    <>
      <tr className="bg-muted/30">
        <td colSpan={editavel ? 4 : 3} className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
          {titulo} <span className="font-normal">· {subtotal}h</span>
        </td>
      </tr>
      {lista.map((i) => (
        <tr key={i.idDisciplina} className="hover:bg-muted/20">
          <td className="px-4 py-2.5">
            <div className="font-medium text-foreground">{i.nome}</div>
            {i.codigo && <div className="text-xs text-muted-foreground">{i.codigo}</div>}
          </td>
          <td className="px-4 py-2.5 text-muted-foreground">{i.cargaHoraria}h</td>
          <td className="px-4 py-2.5 text-muted-foreground">{i.preRequisito || "—"}</td>
          {editavel && (
            <td className="px-4 py-2.5">
              <div className="flex justify-end">
                <DeleteButton
                  action={removerDisciplinaGrade.bind(null, idGrade, i.idDisciplina)}
                  confirmacao="Remover esta disciplina da grade?"
                  label="Remover"
                />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
