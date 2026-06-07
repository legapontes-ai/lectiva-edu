"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Award } from "lucide-react";
import { emitirCertificado } from "@/lib/certificados/actions";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Opcao = { id: string; nome: string };

export function EmitirCertificadoForm({
  alunos,
  cursos,
  modelos,
}: {
  alunos: Opcao[];
  cursos: Opcao[];
  modelos: Opcao[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [idAluno, setIdAluno] = useState("");
  const [idCurso, setIdCurso] = useState("");
  const [idModelo, setIdModelo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    if (!idAluno || !idCurso || !idModelo) {
      setErro("Selecione aluno, curso e modelo.");
      return;
    }
    startTransition(async () => {
      const res = await emitirCertificado(idAluno, idCurso, idModelo);
      if (res?.erro) {
        setErro(res.erro);
      } else {
        setOk(true);
        setIdAluno("");
        setIdCurso("");
        setIdModelo("");
        router.refresh();
      }
    });
  }

  const semModelos = modelos.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" /> {erro}
        </div>
      )}
      {ok && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="size-4 shrink-0" /> Certificado emitido com sucesso.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Aluno" htmlFor="idAluno">
          <Select
            id="idAluno"
            value={idAluno}
            onChange={(e) => setIdAluno(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Curso" htmlFor="idCurso">
          <Select
            id="idCurso"
            value={idCurso}
            onChange={(e) => setIdCurso(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Modelo" htmlFor="idModelo">
          <Select
            id="idModelo"
            value={idModelo}
            onChange={(e) => setIdModelo(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">
        A emissão valida automaticamente a regularidade financeira (sem parcelas
        vencidas) e a existência de avaliação aprovada do aluno.
      </p>

      <Button type="submit" disabled={pending || semModelos}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
        Emitir certificado
      </Button>
      {semModelos && (
        <p className="text-xs text-destructive">
          Cadastre um modelo ativo antes de emitir certificados.
        </p>
      )}
    </form>
  );
}
