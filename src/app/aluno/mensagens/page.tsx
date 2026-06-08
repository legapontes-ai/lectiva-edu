import type { Metadata } from "next";
import type { StatusMensagem } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { rotulo } from "@/lib/enums";
import { formatarDataHora } from "@/lib/format";
import { TIPO_MENSAGEM, STATUS_MENSAGEM } from "@/lib/validations/mensagem";
import { PageHeader } from "@/components/painel/page-header";
import { NovaMensagemForm } from "@/components/aluno/nova-mensagem-form";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Atendimento — Área do Aluno" };

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const VARIANTE_STATUS: Record<StatusMensagem, BadgeVariant> = {
  Aberta: "info",
  EmAndamento: "warning",
  Respondida: "success",
  Encerrada: "muted",
};

export default async function AlunoMensagensPage() {
  const { user, aluno } = await alunoDaSessao();

  const [mensagens, gd] = await Promise.all([
    prisma.mensagemSolicitacao.findMany({
      where: { idRemetente: user.id },
      include: { disciplina: { select: { nome: true } } },
      orderBy: { dataEnvio: "desc" },
    }),
    aluno
      ? prisma.gradeDisciplina.findMany({
          where: { grade: { curso: { matriculas: { some: { idAluno: aluno.id } } } } },
          select: { disciplina: { select: { id: true, nome: true } } },
        })
      : Promise.resolve([]),
  ]);

  // Disciplinas únicas para o seletor de contexto.
  const disciplinas = [...new Map(gd.map((g) => [g.disciplina.id, g.disciplina])).values()].sort(
    (a, b) => a.nome.localeCompare(b.nome),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Atendimento"
        descricao="Envie dúvidas e solicitações à instituição e acompanhe as respostas."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova mensagem</CardTitle>
          <CardDescription>Sua mensagem é encaminhada à equipe acadêmica.</CardDescription>
        </CardHeader>
        <CardContent>
          <NovaMensagemForm disciplinas={disciplinas} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Minhas mensagens</h2>
        {mensagens.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <MessageSquare className="size-5 shrink-0" />
              <p className="text-sm">Você ainda não enviou mensagens.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {mensagens.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {m.assunto || rotulo(TIPO_MENSAGEM, m.tipo)}
                      </CardTitle>
                      <CardDescription>
                        {rotulo(TIPO_MENSAGEM, m.tipo)} · {formatarDataHora(m.dataEnvio)}
                        {m.disciplina ? ` · ${m.disciplina.nome}` : ""}
                      </CardDescription>
                    </div>
                    <Badge variant={VARIANTE_STATUS[m.status]}>
                      {rotulo(STATUS_MENSAGEM, m.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{m.conteudo}</p>
                  {m.resposta ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Resposta da equipe</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{m.resposta}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
