"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  matriculaSchema,
  camposPorEtapa,
  type MatriculaInput,
  type DocumentoAnexo,
} from "@/lib/validations/matricula";
import { criarMatricula, enviarDocumentosMatricula } from "@/lib/matriculas/actions";
import { TIPO_CURSO, MODALIDADE_CURSO, rotulo } from "@/lib/enums";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type TurmaOpc = { id: string; nome: string; anoPeriodo: string };
type CursoOpc = {
  id: string;
  nome: string;
  tipo: string;
  modalidade: string;
  turmas: TurmaOpc[];
};

const PASSOS = [
  { numero: 1, titulo: "Dados pessoais" },
  { numero: 2, titulo: "Formação anterior" },
  { numero: 3, titulo: "Aceite e consentimento" },
  { numero: 4, titulo: "Confirmação" },
] as const;

export function MatriculaWizard({
  cursos,
  cursoInicial,
  turmaInicial,
}: {
  cursos: CursoOpc[];
  cursoInicial?: string;
  turmaInicial?: string;
}) {
  const [passo, setPasso] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  // Seleção de curso/turma (enviados à action separadamente dos dados do form).
  const [idCurso, setIdCurso] = useState<string>(cursoInicial ?? (cursos.length === 1 ? cursos[0].id : ""));
  const [idTurma, setIdTurma] = useState<string>(turmaInicial ?? "");
  const [erroCurso, setErroCurso] = useState<string | null>(null);

  // Documentos selecionados (enviados ao Storage no envio final).
  const [arquivos, setArquivos] = useState<File[]>([]);

  const turmasDisponiveis = useMemo(
    () => cursos.find((c) => c.id === idCurso)?.turmas ?? [],
    [cursos, idCurso],
  );

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<MatriculaInput>({
    resolver: zodResolver(matriculaSchema) as never,
    defaultValues: {
      nome: "",
      email: "",
      cpf: "",
      rg: "",
      dataNascimento: "",
      telefone: "",
      endereco: "",
      filiacao: "",
      nacionalidade: "",
      estadoCivil: "",
      senha: "",
      formacaoGraduacao: "",
      instituicaoAnterior: "",
      anoConclusao: undefined,
      numeroDiploma: "",
      contratoAceito: false,
      consentimentoLGPD: false,
    },
  });

  function selecionarCurso(id: string) {
    setIdCurso(id);
    setErroCurso(null);
    const turmas = cursos.find((c) => c.id === id)?.turmas ?? [];
    if (!turmas.some((t) => t.id === idTurma)) setIdTurma("");
  }

  function adicionarArquivos(lista: FileList | null) {
    if (!lista) return;
    setArquivos((atual) => [...atual, ...Array.from(lista)]);
  }

  function removerArquivo(indice: number) {
    setArquivos((atual) => atual.filter((_, i) => i !== indice));
  }

  async function avancar() {
    setErro(null);
    if (passo === 1 && !idCurso) {
      setErroCurso("Selecione o curso desejado.");
      return;
    }
    const campos = camposPorEtapa[passo as 1 | 2 | 3];
    if (campos) {
      const ok = await trigger(campos as never);
      if (!ok) return;
    }
    setPasso((p) => Math.min(p + 1, PASSOS.length));
  }

  function voltar() {
    setErro(null);
    setPasso((p) => Math.max(p - 1, 1));
  }

  async function finalizar() {
    setErro(null);
    const ok = await trigger(camposPorEtapa[3] as never);
    if (!ok) return;
    if (!idCurso) {
      setErro("Selecione o curso antes de concluir.");
      setPasso(1);
      return;
    }

    setEnviando(true);
    try {
      let docs: DocumentoAnexo[] = [];
      if (arquivos.length > 0) {
        const fd = new FormData();
        fd.append("email", getValues("email"));
        arquivos.forEach((f) => fd.append("arquivos", f));
        const up = await enviarDocumentosMatricula(fd);
        if (up.erro) {
          setErro(up.erro);
          return;
        }
        docs = up.arquivos ?? [];
      }

      const valores = getValues();
      const res = await criarMatricula(
        { ...valores, documentosAnexos: docs },
        idCurso,
        idTurma || undefined,
      );
      if (res.erro) {
        setErro(res.erro);
        return;
      }
      setProtocolo(res.protocolo ?? null);
      setPasso(4);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de etapas */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Etapas da matrícula">
        {PASSOS.map((p, i) => {
          const ativo = p.numero === passo;
          const concluido = p.numero < passo;
          return (
            <li key={p.numero} className="flex items-center gap-2">
              <span
                aria-current={ativo ? "step" : undefined}
                className={[
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  concluido
                    ? "bg-success/15 text-success"
                    : ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {concluido ? <CheckCircle2 className="size-4" /> : p.numero}
              </span>
              <span
                className={[
                  "hidden text-sm sm:inline",
                  ativo ? "font-medium text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {p.titulo}
              </span>
              {i < PASSOS.length - 1 && (
                <span className="mx-1 hidden h-px w-6 bg-border sm:inline-block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5" noValidate>
          {/* ---------------------------------------------------------------- */}
          {/* Etapa 1 — Dados pessoais */}
          {/* ---------------------------------------------------------------- */}
          {passo === 1 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Curso" htmlFor="curso" error={erroCurso ?? undefined}>
                  <Select
                    id="curso"
                    value={idCurso}
                    onChange={(e) => selecionarCurso(e.target.value)}
                    aria-invalid={!!erroCurso}
                  >
                    <option value="">— Selecione o curso —</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({rotulo(TIPO_CURSO, c.tipo)} · {rotulo(MODALIDADE_CURSO, c.modalidade)})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Turma (opcional)" htmlFor="turma">
                  <Select
                    id="turma"
                    value={idTurma}
                    onChange={(e) => setIdTurma(e.target.value)}
                    disabled={turmasDisponiveis.length === 0}
                  >
                    <option value="">
                      {turmasDisponiveis.length === 0 ? "— Sem turmas abertas —" : "— A definir —"}
                    </option>
                    {turmasDisponiveis.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} · {t.anoPeriodo}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
                <Input id="nome" autoComplete="name" {...register("nome")} aria-invalid={!!errors.nome} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="E-mail (será seu login)" htmlFor="email" error={errors.email?.message}>
                  <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
                </Field>
                <Field
                  label="Senha de acesso"
                  htmlFor="senha"
                  error={errors.senha?.message}
                  hint="Mín. 8 caracteres, com letra e número."
                >
                  <PasswordInput id="senha" autoComplete="new-password" {...register("senha")} aria-invalid={!!errors.senha} />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
                  <Input id="cpf" inputMode="numeric" placeholder="000.000.000-00" {...register("cpf")} aria-invalid={!!errors.cpf} />
                </Field>
                <Field label="RG (opcional)" htmlFor="rg" error={errors.rg?.message}>
                  <Input id="rg" {...register("rg")} />
                </Field>
                <Field label="Data de nascimento" htmlFor="dataNascimento" error={errors.dataNascimento?.message}>
                  <Input id="dataNascimento" type="date" {...register("dataNascimento")} aria-invalid={!!errors.dataNascimento} />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message}>
                  <Input id="telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" {...register("telefone")} aria-invalid={!!errors.telefone} />
                </Field>
                <Field label="Filiação (opcional)" htmlFor="filiacao" error={errors.filiacao?.message}>
                  <Input id="filiacao" placeholder="Nome do pai e/ou da mãe" {...register("filiacao")} />
                </Field>
              </div>

              <Field label="Endereço" htmlFor="endereco" error={errors.endereco?.message}>
                <Textarea id="endereco" {...register("endereco")} aria-invalid={!!errors.endereco} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nacionalidade (opcional)" htmlFor="nacionalidade" error={errors.nacionalidade?.message}>
                  <Input id="nacionalidade" placeholder="Brasileira" {...register("nacionalidade")} />
                </Field>
                <Field label="Estado civil (opcional)" htmlFor="estadoCivil" error={errors.estadoCivil?.message}>
                  <Input id="estadoCivil" {...register("estadoCivil")} />
                </Field>
              </div>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Etapa 2 — Formação anterior + documentos */}
          {/* ---------------------------------------------------------------- */}
          {passo === 2 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Formação / graduação (opcional)" htmlFor="formacaoGraduacao" error={errors.formacaoGraduacao?.message}>
                  <Input id="formacaoGraduacao" {...register("formacaoGraduacao")} />
                </Field>
                <Field label="Instituição anterior (opcional)" htmlFor="instituicaoAnterior" error={errors.instituicaoAnterior?.message}>
                  <Input id="instituicaoAnterior" {...register("instituicaoAnterior")} />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ano de conclusão (opcional)" htmlFor="anoConclusao" error={errors.anoConclusao?.message}>
                  <Input id="anoConclusao" type="number" min={1950} max={2100} {...register("anoConclusao")} />
                </Field>
                <Field label="Número do diploma (opcional)" htmlFor="numeroDiploma" error={errors.numeroDiploma?.message}>
                  <Input id="numeroDiploma" {...register("numeroDiploma")} />
                </Field>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentos">Documentos (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Anexe documentos como RG, CPF, diploma ou histórico. Aceitamos PDF e imagens.
                </p>
                <label
                  htmlFor="documentos"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  <Upload className="size-6" />
                  <span>Clique para selecionar os arquivos</span>
                  <input
                    id="documentos"
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      adicionarArquivos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                {arquivos.length > 0 && (
                  <ul className="space-y-2">
                    {arquivos.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-foreground">{f.name}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remover ${f.name}`}
                          onClick={() => removerArquivo(i)}
                        >
                          <X className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Etapa 3 — Aceite de contrato + consentimento LGPD */}
          {/* ---------------------------------------------------------------- */}
          {passo === 3 && (
            <>
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <input
                    id="contratoAceito"
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                    aria-invalid={!!errors.contratoAceito}
                    {...register("contratoAceito")}
                  />
                  <span className="text-sm text-foreground">
                    Li e aceito o contrato de prestação de serviços educacionais e os{" "}
                    <Link href="/termos-de-uso" target="_blank" className="text-link underline-offset-4 hover:underline">
                      Termos de Uso
                    </Link>
                    .
                  </span>
                </label>
                {errors.contratoAceito?.message && (
                  <p className="text-xs text-destructive">{errors.contratoAceito.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <input
                    id="consentimentoLGPD"
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                    aria-invalid={!!errors.consentimentoLGPD}
                    {...register("consentimentoLGPD")}
                  />
                  <span className="text-sm text-foreground">
                    Autorizo o tratamento dos meus dados pessoais para fins de matrícula e gestão
                    acadêmica, conforme a{" "}
                    <Link href="/politica-de-privacidade" target="_blank" className="text-link underline-offset-4 hover:underline">
                      Política de Privacidade
                    </Link>{" "}
                    (LGPD).
                  </span>
                </label>
                {errors.consentimentoLGPD?.message && (
                  <p className="text-xs text-destructive">{errors.consentimentoLGPD.message}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Ao concluir, criaremos seu acesso à área do aluno e registraremos uma pré-matrícula
                para conferência pela secretaria.
              </p>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Etapa 4 — Confirmação */}
          {/* ---------------------------------------------------------------- */}
          {passo === 4 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-8" />
              </span>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Pré-matrícula realizada!
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Guarde o número de protocolo abaixo. A secretaria fará a conferência dos seus dados e
                documentos para efetivar a matrícula.
              </p>
              <div className="rounded-lg border border-border bg-muted px-6 py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Protocolo</p>
                <p className="font-heading text-2xl font-bold tracking-tight text-primary">
                  {protocolo}
                </p>
              </div>
              <Button render={<Link href="/login" />}>Acessar área do aluno</Button>
            </div>
          )}

          {/* Navegação */}
          {passo < 4 && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button type="button" variant="ghost" onClick={voltar} disabled={passo === 1 || enviando}>
                <ChevronLeft className="size-4" /> Anterior
              </Button>

              {passo < 3 ? (
                <Button type="button" onClick={avancar}>
                  Próximo <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={finalizar} disabled={enviando}>
                  {enviando && <Loader2 className="size-4 animate-spin" />}
                  Concluir matrícula
                </Button>
              )}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
