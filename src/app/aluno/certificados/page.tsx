import type { Metadata } from "next";
import { Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { alunoDaSessao } from "@/lib/aluno/queries";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { BaixarCertificado } from "@/components/aluno/baixar-certificado";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Certificados — Área do Aluno" };

export default async function AlunoCertificadosPage() {
  const { aluno } = await alunoDaSessao();
  const certificados = aluno
    ? await prisma.certificado.findMany({
        where: { idAluno: aluno.id, situacao: { in: ["Emitido", "Reemitido"] } },
        include: { curso: { select: { nome: true } } },
        orderBy: { dataEmissao: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader titulo="Certificados" descricao="Seus certificados emitidos." />

      {certificados.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <Award className="size-5 shrink-0" />
            <p className="text-sm">
              Você ainda não possui certificados disponíveis. Eles aparecerão aqui assim que forem
              emitidos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificados.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{c.curso.nome}</CardTitle>
                    <CardDescription>
                      Emitido em {formatarData(c.dataEmissao)} · Código:{" "}
                      <span className="font-mono text-foreground">{c.codigoAutenticacao}</span>
                    </CardDescription>
                  </div>
                  <BaixarCertificado id={c.id} />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
