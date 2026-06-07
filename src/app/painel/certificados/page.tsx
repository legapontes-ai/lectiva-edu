import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Award, FileText } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { excluirModelo } from "@/lib/certificados/actions";
import {
  TIPO_CERTIFICADO,
  SITUACAO_MODELO_CERTIFICADO,
  SITUACAO_CERTIFICADO,
} from "@/lib/validations/certificado";
import { rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { EmitirCertificadoForm } from "@/components/certificados/emitir-certificado-form";
import { CertificadoAcoes } from "@/components/certificados/certificado-acoes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Certificados" };

function badgeSituacao(situacao: string) {
  if (situacao === "Emitido") return "success" as const;
  if (situacao === "Cancelado") return "danger" as const;
  return "muted" as const;
}

export default async function CertificadosPage() {
  await requirePermission("certificados.gerenciar");

  const [modelos, certificados, alunos, cursos] = await Promise.all([
    prisma.modeloCertificado.findMany({ orderBy: { nome: "asc" } }),
    prisma.certificado.findMany({
      orderBy: { dataEmissao: "desc" },
      include: {
        aluno: { select: { nome: true } },
        curso: { select: { nome: true } },
      },
    }),
    prisma.aluno.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.curso.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const modelosAtivos = modelos
    .filter((m) => m.situacao === "Ativo")
    .map((m) => ({ id: m.id, nome: m.nome }));

  return (
    <div className="space-y-8">
      <PageHeader
        titulo="Certificados"
        descricao="Emita, gerencie e acompanhe os certificados da instituição."
      />

      {/* Emitir certificado */}
      <Card>
        <CardHeader>
          <CardTitle>Emitir certificado</CardTitle>
          <CardDescription>
            Selecione aluno, curso e modelo. Os requisitos são validados na emissão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmitirCertificadoForm alunos={alunos} cursos={cursos} modelos={modelosAtivos} />
        </CardContent>
      </Card>

      {/* Modelos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">Modelos</h2>
            <p className="text-sm text-muted-foreground">Modelos de certificado disponíveis.</p>
          </div>
          <Button render={<Link href="/painel/certificados/modelos/novo" />}>
            <Plus className="size-4" /> Novo modelo
          </Button>
        </div>

        {modelos.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum modelo cadastrado ainda.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Situação</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modelos.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{m.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rotulo(TIPO_CERTIFICADO, m.tipo)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.situacao === "Ativo" ? "success" : "muted"}>
                          {rotulo(SITUACAO_MODELO_CERTIFICADO, m.situacao)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            render={<Link href={`/painel/certificados/modelos/${m.id}`} />}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirModelo.bind(null, m.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Emitidos */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-primary">Emitidos</h2>
          <p className="text-sm text-muted-foreground">Histórico de certificados emitidos.</p>
        </div>

        {certificados.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Award className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum certificado emitido ainda.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Aluno</th>
                    <th className="px-4 py-3 font-semibold">Curso</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Código</th>
                    <th className="px-4 py-3 font-semibold">Emissão</th>
                    <th className="px-4 py-3 font-semibold">Situação</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {certificados.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{c.aluno.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.curso.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rotulo(TIPO_CERTIFICADO, c.tipo)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.codigoAutenticacao}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatarData(c.dataEmissao)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeSituacao(c.situacao)}>
                          {rotulo(SITUACAO_CERTIFICADO, c.situacao)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <CertificadoAcoes
                          id={c.id}
                          situacao={c.situacao}
                          temArquivo={!!c.arquivoPdf}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
