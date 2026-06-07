"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  execucaoSchema,
  type ExecucaoInput,
  EXECUCAO,
  TIPO_DOCENTE,
  MOTIVOS_EXECUCAO,
} from "@/lib/validations/plano";
import { registrarExecucaoAula } from "@/lib/planos/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type ExecucaoValores = {
  execucao: string;
  motivo: string;
  docenteTipo: string;
  docenteNome: string;
};

export function ExecucaoForm({
  idAula,
  professorTitular,
  valores,
  onDone,
  onCancel,
}: {
  idAula: string;
  professorTitular: string;
  valores: ExecucaoValores;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  // se o motivo salvo não está na lista, é "Outro" (texto livre)
  const motivoNaLista = (MOTIVOS_EXECUCAO as readonly string[]).includes(valores.motivo);
  const [motivoOutro, setMotivoOutro] = useState(!!valores.motivo && !motivoNaLista);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExecucaoInput>({
    resolver: zodResolver(execucaoSchema) as never,
    defaultValues: {
      execucao: (valores.execucao || "Pendente") as ExecucaoInput["execucao"],
      motivo: valores.motivo ?? "",
      docenteTipo: valores.docenteTipo ?? "Titular",
      docenteNome: valores.docenteNome ?? "",
    },
  });

  const execucao = watch("execucao");
  const docenteTipo = watch("docenteTipo");
  const exigeMotivo = execucao === "Parcial" || execucao === "NaoDado";

  async function onSubmit(values: ExecucaoInput) {
    setErro(null);
    const res = await registrarExecucaoAula(idAula, values);
    if (res?.erro) {
      setErro(res.erro);
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="O conteúdo foi dado?" htmlFor={`exec-${idAula}`} error={errors.execucao?.message}>
        <Select id={`exec-${idAula}`} {...register("execucao")}>
          {EXECUCAO.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </Field>

      {exigeMotivo && (
        <Field label="Motivo" htmlFor={`motivo-sel-${idAula}`} error={errors.motivo?.message}>
          <Select
            id={`motivo-sel-${idAula}`}
            value={motivoOutro ? "Outro" : watch("motivo") || ""}
            onChange={(e) => {
              if (e.target.value === "Outro") {
                setMotivoOutro(true);
                setValue("motivo", "", { shouldValidate: true });
              } else {
                setMotivoOutro(false);
                setValue("motivo", e.target.value, { shouldValidate: true });
              }
            }}
          >
            <option value="">— Selecione —</option>
            {MOTIVOS_EXECUCAO.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
          {motivoOutro && (
            <Input className="mt-2" placeholder="Descreva o motivo" {...register("motivo")} />
          )}
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Docente" htmlFor={`doc-${idAula}`}>
          <Select id={`doc-${idAula}`} {...register("docenteTipo")}>
            {TIPO_DOCENTE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        {docenteTipo === "Substituto" ? (
          <Field label="Nome do substituto" htmlFor={`docn-${idAula}`} error={errors.docenteNome?.message}>
            <Input id={`docn-${idAula}`} placeholder="Nome do professor substituto" {...register("docenteNome")} />
          </Field>
        ) : (
          <Field label="Titular">
            <Input value={professorTitular} disabled readOnly />
          </Field>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Salvar execução
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
