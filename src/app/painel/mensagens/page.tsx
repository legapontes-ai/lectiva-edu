import type { Metadata } from "next";
import type { StatusMensagem } from "@prisma/client";
import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { formatarDataHora } from "@/lib/format";
import { TIPO_MENSAGEM, STATUS_MENSAGEM } from "@/lib/validations/mensagem";
import { PageHeader } from "@/components/painel/page-header";
import { ResponderForm } from "@/components/mensagens/responder-form";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Mensagens" };

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const VARIANTE_STATUS: Record<StatusMensagem, BadgeVariant> = {
  Aberta: "info",
  EmAndamento: "warning",
  Respondida: "success",
  Encerrada: "muted",
};

export default async function PainelMensagensPage() {
  await requirePermission("mensagens.responder");

  const mensagens = await prisma.mensagemSolicitacao.findMany({
    include: {
      remetente: { select: { nome: true } },
      destinatario: { select: { nome: true } },
      disciplina: { select: { nome: true } },
    },
    orderBy: [{ status: "asc" }, { dataEnvio: "desc" }],
  });

  const abertas = mensagens.filter((m) => m.status === "Aberta" || m.status === "EmAndamento").length;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mensagens"
        descricao={`Solicitações e dúvidas dos alunos.${abertas ? ` ${abertas} em aberto.` : ""}`}
      />

      {mensagens.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <Inbox className="size-5 shrink-0" />
            <p className="text-sm">Nenhuma mensagem recebida.</p>
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
                      {m.remetente.nome} · {rotulo(TIPO_MENSAGEM, m.tipo)} ·{" "}
                      {formatarDataHora(m.dataEnvio)}
                      {m.disciplina ? ` · ${m.disciplina.nome}` : ""}
                      {m.destinatario ? ` · encaminhado a ${m.destinatario.nome}` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant={VARIANTE_STATUS[m.status]}>
                    {rotulo(STATUS_MENSAGEM, m.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">{m.conteudo}</p>
                <ResponderForm
                  id={m.id}
                  respostaAtual={m.resposta}
                  encerrada={m.status === "Encerrada"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
