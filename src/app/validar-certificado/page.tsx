import type { Metadata } from "next";
import { ShieldCheck, ShieldX, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarData } from "@/lib/format";
import { TIPO_CERTIFICADO } from "@/lib/validations/certificado";
import { rotulo } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Validar certificado",
  description:
    "Verifique a autenticidade de um certificado Lectiva Edu pelo código de autenticação.",
};

type SearchParams = Promise<{ codigo?: string }>;

export default async function ValidarCertificadoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { codigo: codigoRaw } = await searchParams;
  const codigo = codigoRaw?.trim().toUpperCase();

  const certificado = codigo
    ? await prisma.certificado.findUnique({
        where: { codigoAutenticacao: codigo },
        include: {
          aluno: { select: { nome: true } },
          curso: { select: { nome: true } },
        },
      })
    : null;

  const consultou = !!codigo;
  const valido = !!certificado && certificado.situacao === "Emitido";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Validação de certificados
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Informe o código de autenticação impresso no certificado para
              verificar sua autenticidade.
            </p>

            <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Input
                name="codigo"
                defaultValue={codigo ?? ""}
                placeholder="Código de autenticação (ex.: A1B2C3D4E5F6)"
                aria-label="Código de autenticação"
                className="sm:flex-1"
                autoCapitalize="characters"
              />
              <Button type="submit">
                <Search className="size-4" /> Validar
              </Button>
            </form>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          {!consultou ? (
            <p className="text-center text-muted-foreground">
              Digite um código acima para iniciar a verificação.
            </p>
          ) : valido && certificado ? (
            <Card className="overflow-hidden border-success/40">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-border bg-success/10">
                <ShieldCheck className="size-7 shrink-0 text-success" />
                <div>
                  <CardTitle className="text-success">Certificado válido</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Documento autêntico emitido pela Lectiva Edu.
                  </p>
                </div>
                <Badge variant="success" className="ml-auto">
                  Emitido
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Aluno
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {certificado.aluno.nome}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Curso
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {certificado.curso.nome}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tipo
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {rotulo(TIPO_CERTIFICADO, certificado.tipo)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Carga horária
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {certificado.cargaHoraria ? `${certificado.cargaHoraria} horas` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Data de emissão
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {formatarData(certificado.dataEmissao)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Código
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">
                      {certificado.codigoAutenticacao}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-destructive/40">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-border bg-destructive/10">
                <ShieldX className="size-7 shrink-0 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">
                    Certificado não encontrado
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {certificado
                      ? "Este certificado não está mais válido (cancelado ou reemitido)."
                      : "Nenhum certificado corresponde ao código informado."}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Confira o código de autenticação e tente novamente. Em caso de
                dúvida, entre em contato com a secretaria.
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
