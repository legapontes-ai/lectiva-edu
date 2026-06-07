"use client";

import { useState } from "react";
import { Pencil, ClipboardCheck, FileText, ExternalLink } from "lucide-react";
import { removerAula, removerMaterialAula } from "@/lib/planos/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/painel/delete-button";
import { AulaForm } from "@/components/planos/aula-form";
import { ExecucaoForm } from "@/components/planos/execucao-form";
import { MaterialForm } from "@/components/planos/material-form";
import { EXECUCAO_INFO } from "@/lib/validations/plano";

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
  execucao: string;
  motivoExecucao: string | null;
  docenteTipo: string | null;
  docenteNome: string | null;
  materiais: Material[];
};

export function AulaItem({
  aula,
  podeEditar,
  professorTitular,
}: {
  aula: AulaItemDados;
  podeEditar: boolean;
  professorTitular: string;
}) {
  const [editando, setEditando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const info = EXECUCAO_INFO[aula.execucao] ?? EXECUCAO_INFO.Pendente;
  const docenteLabel =
    aula.docenteTipo === "Substituto"
      ? `Substituto${aula.docenteNome ? ` · ${aula.docenteNome}` : ""}`
      : aula.docenteTipo === "Titular"
        ? `Titular · ${professorTitular}`
        : null;

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
                <Badge variant={info.variant}>{info.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {aula.dataPrevistaLabel ? `Prevista: ${aula.dataPrevistaLabel}` : "Sem data prevista"}
                {aula.cargaHoraria ? ` · ${aula.cargaHoraria}h` : ""}
                {docenteLabel ? ` · ${docenteLabel}` : ""}
              </p>
              {aula.motivoExecucao && (
                <p className="mt-0.5 text-xs text-destructive">Motivo: {aula.motivoExecucao}</p>
              )}
            </div>
          </div>

          {podeEditar && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setRegistrando((v) => !v)}
                title="Registrar execução"
                aria-label="Registrar execução"
                aria-expanded={registrando}
              >
                <ClipboardCheck className="size-4 text-link" />
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

        {registrando && podeEditar && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <ExecucaoForm
              idAula={aula.id}
              professorTitular={professorTitular}
              valores={{
                execucao: aula.execucao,
                motivo: aula.motivoExecucao ?? "",
                docenteTipo: aula.docenteTipo ?? "Titular",
                docenteNome: aula.docenteNome ?? "",
              }}
              onDone={() => setRegistrando(false)}
              onCancel={() => setRegistrando(false)}
            />
          </div>
        )}

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
