"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, CheckCircle2, Circle, Loader2, FileText, ExternalLink } from "lucide-react";
import { alternarConclusaoAula, removerAula, removerMaterialAula } from "@/lib/planos/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/painel/delete-button";
import { AulaForm } from "@/components/planos/aula-form";
import { MaterialForm } from "@/components/planos/material-form";

type Material = { id: string; titulo: string; arquivoUrl: string | null };

export type AulaItemDados = {
  id: string;
  ordem: number;
  titulo: string;
  conteudo: string | null;
  objetivos: string | null;
  dataPrevista: string | null;
  dataPrevistaLabel: string | null;
  cargaHoraria: number | null;
  concluida: boolean;
  dataConclusaoLabel: string | null;
  materiais: Material[];
};

export function AulaItem({ aula, podeEditar }: { aula: AulaItemDados; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleConclusao() {
    startTransition(async () => {
      await alternarConclusaoAula(aula.id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {aula.ordem}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{aula.titulo}</h3>
                {aula.concluida ? (
                  <Badge variant="success">
                    Ministrada{aula.dataConclusaoLabel ? ` · ${aula.dataConclusaoLabel}` : ""}
                  </Badge>
                ) : (
                  <Badge variant="muted">Pendente</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {aula.dataPrevistaLabel ? `Prevista: ${aula.dataPrevistaLabel}` : "Sem data prevista"}
                {aula.cargaHoraria ? ` · ${aula.cargaHoraria}h` : ""}
              </p>
            </div>
          </div>

          {podeEditar && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleConclusao}
                disabled={pending}
                title={aula.concluida ? "Marcar como pendente" : "Marcar como ministrada"}
                aria-label={aula.concluida ? "Marcar como pendente" : "Marcar como ministrada"}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : aula.concluida ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditando((v) => !v)}
                title="Editar aula"
                aria-label="Editar aula"
                aria-expanded={editando}
              >
                <Pencil className="size-4" />
              </Button>
              <DeleteButton action={removerAula.bind(null, aula.id)} label="Remover aula" />
            </div>
          )}
        </div>

        {!editando && (aula.conteudo || aula.objetivos) && (
          <div className="space-y-2 pl-10 text-sm">
            {aula.conteudo && <p className="whitespace-pre-wrap text-foreground">{aula.conteudo}</p>}
            {aula.objetivos && (
              <p className="whitespace-pre-wrap text-muted-foreground">
                <span className="font-medium">Objetivos: </span>
                {aula.objetivos}
              </p>
            )}
          </div>
        )}

        {editando && podeEditar && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <AulaForm
              aula={{
                id: aula.id,
                titulo: aula.titulo,
                conteudo: aula.conteudo,
                objetivos: aula.objetivos,
                dataPrevista: aula.dataPrevista,
                cargaHoraria: aula.cargaHoraria,
                ordem: aula.ordem,
              }}
              onDone={() => setEditando(false)}
              onCancel={() => setEditando(false)}
            />
          </div>
        )}

        {/* Materiais */}
        <div className="space-y-2 pl-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Materiais</p>
          {aula.materiais.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum material anexado.</p>
          ) : (
            <ul className="space-y-1.5">
              {aula.materiais.map((m) => {
                const externo = m.arquivoUrl?.startsWith("http");
                return (
                  <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      {externo ? (
                        <a href={m.arquivoUrl!} target="_blank" rel="noopener noreferrer" className="truncate text-link hover:underline">
                          {m.titulo} <ExternalLink className="inline size-3" />
                        </a>
                      ) : (
                        <span className="truncate text-foreground">{m.titulo}</span>
                      )}
                    </span>
                    {podeEditar && <DeleteButton action={removerMaterialAula.bind(null, m.id)} label="Remover material" />}
                  </li>
                );
              })}
            </ul>
          )}
          {podeEditar && (
            <div className="pt-2">
              <MaterialForm idAula={aula.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
