"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { cursoSchema, type CursoInput } from "@/lib/validations/curso";
import { criarCurso, atualizarCurso } from "@/lib/cursos/actions";
import { TIPO_CURSO, MODALIDADE_CURSO, SITUACAO_CURSO } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type CursoFormValues = Partial<CursoInput> & { id?: string };

export function CursoForm({
  curso,
  coordenadores,
}: {
  curso?: CursoFormValues;
  coordenadores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CursoInput>({
    resolver: zodResolver(cursoSchema) as never,
    defaultValues: {
      nome: curso?.nome ?? "",
      tipo: curso?.tipo ?? "MBA",
      modalidade: curso?.modalidade ?? "Presencial",
      situacao: curso?.situacao ?? "Ativo",
      cargaHoraria: curso?.cargaHoraria,
      duracaoMeses: curso?.duracaoMeses,
      valorInvestimento: curso?.valorInvestimento,
      areaConhecimento: curso?.areaConhecimento ?? "",
      formaPagamento: curso?.formaPagamento ?? "",
      objetivos: curso?.objetivos ?? "",
      metodologia: curso?.metodologia ?? "",
      requisitosConclusao: curso?.requisitosConclusao ?? "",
      idCoordenador: curso?.idCoordenador ?? "",
    },
  });

  async function onSubmit(values: CursoInput) {
    setErro(null);
    const res = curso?.id ? await atualizarCurso(curso.id, values) : await criarCurso(values);
    if (res?.erro) setErro(res.erro);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Field label="Nome do curso" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            {TIPO_CURSO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Modalidade" htmlFor="modalidade" error={errors.modalidade?.message}>
          <Select id="modalidade" {...register("modalidade")}>
            {MODALIDADE_CURSO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Situação" htmlFor="situacao" error={errors.situacao?.message}>
          <Select id="situacao" {...register("situacao")}>
            {SITUACAO_CURSO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Carga horária (h)" htmlFor="cargaHoraria" error={errors.cargaHoraria?.message}>
          <Input id="cargaHoraria" type="number" min={1} {...register("cargaHoraria")} />
        </Field>
        <Field label="Duração (meses)" htmlFor="duracaoMeses" error={errors.duracaoMeses?.message}>
          <Input id="duracaoMeses" type="number" min={1} {...register("duracaoMeses")} />
        </Field>
        <Field label="Valor de investimento (R$)" htmlFor="valorInvestimento" error={errors.valorInvestimento?.message}>
          <Input id="valorInvestimento" type="number" step="0.01" min={0} {...register("valorInvestimento")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Área de conhecimento" htmlFor="areaConhecimento" error={errors.areaConhecimento?.message}>
          <Input id="areaConhecimento" {...register("areaConhecimento")} />
        </Field>
        <Field label="Forma de pagamento" htmlFor="formaPagamento" error={errors.formaPagamento?.message}>
          <Input id="formaPagamento" {...register("formaPagamento")} />
        </Field>
      </div>

      <Field label="Coordenador(a)" htmlFor="idCoordenador" error={errors.idCoordenador?.message}>
        <Select id="idCoordenador" {...register("idCoordenador")}>
          <option value="">— Sem coordenador —</option>
          {coordenadores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
      </Field>

      <Field label="Objetivos" htmlFor="objetivos" error={errors.objetivos?.message}>
        <Textarea id="objetivos" {...register("objetivos")} />
      </Field>
      <Field label="Metodologia" htmlFor="metodologia" error={errors.metodologia?.message}>
        <Textarea id="metodologia" {...register("metodologia")} />
      </Field>
      <Field label="Requisitos de conclusão" htmlFor="requisitosConclusao" error={errors.requisitosConclusao?.message}>
        <Textarea id="requisitosConclusao" {...register("requisitosConclusao")} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {curso?.id ? "Salvar alterações" : "Criar curso"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
