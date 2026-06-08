import type { Metadata } from "next";
import Link from "next/link";
import type { SituacaoMatricula } from "@prisma/client";
import { GraduationCap, Wallet, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { formatarBRL } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Área do Aluno" };

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const SITUACAO_MATRICULA: Record<SituacaoMatricula, string> = {
  PreMatricula: "Pré-matrícula",
  Ativa: "Ativa",
  Trancada: "Trancada",
  Cancelada: "Cancelada",
  Concluida: "Concluída",
};

const VARIANTE_SITUACAO: Record<SituacaoMatricula, BadgeVariant> = {
  PreMatricula: "warning",
  Ativa: "success",
  Trancada: "muted",
  Cancelada: "danger",
  Concluida: "info",
};

export default async function AlunoVisaoGeralPage() {
  const { user, aluno } = await alunoDaSessao();

  const matriculas = aluno
    ? await prisma.matricula.findMany({
        where: { idAluno: aluno.id },
        include: { curso: { select: { nome: true } }, turma: { select: { nome: true } } },
        orderBy: { dataMatricula: "desc" },
      })
    : [];

  const planos = aluno
    ? await prisma.planoPagamento.findMany({
        where: { idAluno: aluno.id },
        select: { saldoDevedor: true },
      })
    : [];
  const saldoDevedor = planos.reduce((s, p) => s + Number(p.saldoDevedor), 0);

  const dados = [
    { rotulo: "Nome", valor: aluno?.nome ?? user.nome },
    { rotulo: "E-mail", valor: aluno?.email ?? user.email },
    { rotulo: "CPF", valor: aluno?.cpf ?? "—" },
    { rotulo: "Telefone", valor: aluno?.telefone ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        titulo={`Olá, ${(aluno?.nome ?? user.nome).split(" ")[0]}!`}
        descricao="Bem-vindo(a) à sua Área do Aluno do Lectiva Edu."
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>Seus dados básicos de cadastro.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {dados.map((d) => (
              <div key={d.rotulo} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{d.rotulo}</dt>
                <dd className="text-sm text-foreground">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Meus cursos e turmas</h2>
        {matriculas.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <GraduationCap className="size-5 shrink-0" />
              <p className="text-sm">Você ainda não possui matrículas registradas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matriculas.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle>{m.curso.nome}</CardTitle>
                      <CardDescription>Turma: {m.turma?.nome ?? "A definir"}</CardDescription>
                    </div>
                    <Badge variant={VARIANTE_SITUACAO[m.situacao]}>
                      {SITUACAO_MATRICULA[m.situacao]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Protocolo: <span className="text-foreground">{m.protocolo}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Situação financeira</CardTitle>
          </div>
          <CardDescription>
            {saldoDevedor > 0 ? (
              <>
                Saldo devedor total:{" "}
                <span className="font-semibold text-foreground">{formatarBRL(saldoDevedor)}</span>
              </>
            ) : (
              "Você está em dia. Nenhum saldo devedor."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" render={<Link href="/aluno/financeiro" />}>
            Ver financeiro <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
