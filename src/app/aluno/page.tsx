import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  LogOut,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  Award,
  Receipt,
  ExternalLink,
} from "lucide-react";
import type { SituacaoMatricula } from "@prisma/client";
import { requireUser, exigirSenhaDefinitiva } from "@/lib/auth/dal";
import { sair } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { formatarBRL, formatarData } from "@/lib/format";
import { SITUACAO_PARCELA, varianteParcela } from "@/lib/financeiro/constants";
import { Logo } from "@/components/brand/logo";
import { BaixarCertificado } from "@/components/aluno/baixar-certificado";
import { Button } from "@/components/ui/button";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Área do Aluno" };

const SITUACAO_MATRICULA = [
  { value: "PreMatricula", label: "Pré-matrícula" },
  { value: "Ativa", label: "Ativa" },
  { value: "Trancada", label: "Trancada" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Concluida", label: "Concluída" },
] as const;

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const VARIANTE_SITUACAO: Record<SituacaoMatricula, BadgeVariant> = {
  PreMatricula: "warning",
  Ativa: "success",
  Trancada: "muted",
  Cancelada: "danger",
  Concluida: "info",
};

const EM_BREVE = [
  {
    titulo: "Materiais",
    descricao: "Apostilas, slides e referências das suas disciplinas.",
    icone: BookOpen,
  },
  {
    titulo: "Calendário",
    descricao: "Aulas, prazos e eventos das suas turmas.",
    icone: CalendarDays,
  },
  {
    titulo: "Frequência e Notas",
    descricao: "Acompanhe presenças e o seu desempenho acadêmico.",
    icone: ClipboardCheck,
  },
] as const;

export default async function AreaAlunoPage() {
  const user = await requireUser();
  exigirSenhaDefinitiva(user);
  if (user.vinculo !== "Aluno") redirect("/painel");

  const aluno = await prisma.aluno.findUnique({
    where: { idUsuario: user.id },
    include: {
      matriculas: {
        include: { curso: true, turma: true },
        orderBy: { dataMatricula: "desc" },
      },
      planos: {
        include: {
          curso: { select: { nome: true } },
          parcelas: { orderBy: { numero: "asc" } },
        },
      },
      certificados: {
        where: { situacao: { in: ["Emitido", "Reemitido"] } },
        include: { curso: { select: { nome: true } } },
        orderBy: { dataEmissao: "desc" },
      },
    },
  });

  const planos = aluno?.planos ?? [];
  const saldoDevedor = planos.reduce((s, p) => s + Number(p.saldoDevedor), 0);
  const certificados = aluno?.certificados ?? [];

  const dados = [
    { rotulo: "Nome", valor: aluno?.nome ?? user.nome },
    { rotulo: "E-mail", valor: aluno?.email ?? user.email },
    { rotulo: "CPF", valor: aluno?.cpf ?? "—" },
    { rotulo: "Telefone", valor: aluno?.telefone ?? "—" },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" /> Sair
          </Button>
        </form>
      </div>

      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-primary">
          Olá, {(aluno?.nome ?? user.nome).split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo(a) à sua Área do Aluno do Lectiva Edu.
        </p>
      </header>

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
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Meus cursos e turmas
        </h2>
        {!aluno || aluno.matriculas.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <GraduationCap className="size-5 shrink-0" />
              <p className="text-sm">Você ainda não possui matrículas registradas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {aluno.matriculas.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle>{m.curso.nome}</CardTitle>
                      <CardDescription>
                        Turma: {m.turma?.nome ?? "A definir"}
                      </CardDescription>
                    </div>
                    <Badge variant={VARIANTE_SITUACAO[m.situacao]}>
                      {rotulo(SITUACAO_MATRICULA, m.situacao)}
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

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Financeiro
          </h2>
        </div>
        {planos.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <Receipt className="size-5 shrink-0" />
              <p className="text-sm">
                Você ainda não possui planos de pagamento registrados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {planos.map((plano) => (
              <Card key={plano.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{plano.curso.nome}</CardTitle>
                      <CardDescription>
                        Saldo devedor:{" "}
                        <span className="font-medium text-foreground">
                          {formatarBRL(Number(plano.saldoDevedor))}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={plano.situacao === "Adimplente" ? "success" : "danger"}>
                      {plano.situacao === "Adimplente" ? "Adimplente" : "Inadimplente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {plano.parcelas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma parcela cadastrada.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {plano.parcelas.map((p) => {
                        const emAberto =
                          p.situacao === "EmAberto" || p.situacao === "Vencida";
                        return (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-[8rem] space-y-0.5">
                              <p className="text-sm font-medium text-foreground">
                                Parcela {p.numero} — {formatarBRL(Number(p.valor))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Vencimento: {formatarData(p.vencimento)}
                                {p.dataPagamento
                                  ? ` · Pago em ${formatarData(p.dataPagamento)}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={varianteParcela(p.situacao)}>
                                {rotulo(SITUACAO_PARCELA, p.situacao)}
                              </Badge>
                              {emAberto ? (
                                p.comprovante ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    render={
                                      <a
                                        href={p.comprovante}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      />
                                    }
                                  >
                                    <ExternalLink className="size-4" /> 2ª via
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Procure a secretaria
                                  </span>
                                )
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
            {saldoDevedor > 0 ? (
              <p className="text-sm text-muted-foreground">
                Saldo devedor total:{" "}
                <span className="font-semibold text-foreground">
                  {formatarBRL(saldoDevedor)}
                </span>
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Certificados
          </h2>
        </div>
        {certificados.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
              <Award className="size-5 shrink-0" />
              <p className="text-sm">
                Você ainda não possui certificados disponíveis. Eles aparecerão aqui
                assim que forem emitidos.
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
                        <span className="font-mono text-foreground">
                          {c.codigoAutenticacao}
                        </span>
                      </CardDescription>
                    </div>
                    <BaixarCertificado id={c.id} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Em breve</h2>
        <p className="text-sm text-muted-foreground">
          Novos recursos chegam nas próximas fases do Lectiva Edu.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EM_BREVE.map((item) => {
            const Icone = item.icone;
            return (
              <Card key={item.titulo} className="bg-muted/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icone className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                    <Badge variant="muted">Em breve</Badge>
                  </div>
                  <CardDescription>{item.descricao}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
