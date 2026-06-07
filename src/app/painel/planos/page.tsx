import type { Metadata } from "next";
import Link from "next/link";
import { Plus, NotebookPen } from "lucide-react";
import { requirePermission, requireUser, temPermissao } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { rotulo } from "@/lib/enums";
import { STATUS_PLANO_VALUES } from "@/lib/validations/plano";
import { PageHeader } from "@/components/painel/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Planos de aula" };

const STATUS_PLANO = STATUS_PLANO_VALUES.map((v) => ({
  value: v,
  label: v === "EmElaboracao" ? "Em elaboração" : v === "EmAndamento" ? "Em andamento" : "Concluído",
}));

function statusVariant(status: string): "info" | "warning" | "success" {
  if (status === "Concluido") return "success";
  if (status === "EmAndamento") return "warning";
  return "info";
}

export default async function PlanosPage() {
  await requirePermission("planos.ver");
  const user = await requireUser();
  const podeElaborar = await temPermissao("planos.elaborar");

  const professor = await prisma.professor.findUnique({
    where: { idUsuario: user.id },
    select: { id: true },
  });

  // Professor vê os seus planos; coordenação/gestor (sem cadastro docente) veem todos.
  const planos = await prisma.planoAula.findMany({
    where: professor ? { idProfessor: professor.id } : {},
    orderBy: { atualizadoEm: "desc" },
    select: {
      id: true,
      status: true,
      disciplina: { select: { nome: true, cargaHoraria: true } },
      turma: { select: { nome: true, curso: { select: { nome: true } } } },
      professor: { select: { nome: true } },
      aulas: { select: { execucao: true } },
    },
  });

  const podeCriar = podeElaborar && Boolean(professor);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Planos de aula"
        descricao="Elabore e acompanhe seus planos de ensino, aulas, notas e diário de classe."
        acao={
          podeCriar ? (
            <Button render={<Link href="/painel/planos/novo" />}>
              <Plus className="size-4" /> Novo plano
            </Button>
          ) : undefined
        }
      />

      {planos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {professor
              ? "Você ainda não criou nenhum plano de aula."
              : "Nenhum plano de aula cadastrado."}
          </p>
          {podeCriar && (
            <Button render={<Link href="/painel/planos/novo" />} variant="secondary">
              <Plus className="size-4" /> Criar primeiro plano
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {planos.map((p) => {
            const total = p.aulas.length;
            const c = { Integral: 0, Parcial: 0, NaoDado: 0, Pendente: 0 };
            for (const a of p.aulas) {
              const k = (a.execucao in c ? a.execucao : "Pendente") as keyof typeof c;
              c[k]++;
            }

            return (
              <Link
                key={p.id}
                href={`/painel/planos/${p.id}`}
                className="group rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-heading font-semibold text-primary">
                      {p.disciplina.nome}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.turma.nome} · {p.turma.curso.nome}
                    </p>
                  </div>
                  <Badge variant={statusVariant(p.status)}>{rotulo(STATUS_PLANO, p.status)}</Badge>
                </div>

                {!professor && (
                  <p className="mt-1 text-xs text-muted-foreground">Docente: {p.professor.nome}</p>
                )}

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="success">Integral {c.Integral}</Badge>
                    <Badge variant="warning">Parcial {c.Parcial}</Badge>
                    <Badge variant="danger">Não dada {c.NaoDado}</Badge>
                    <Badge variant="muted">Pendente {c.Pendente}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{total} aula(s) no cronograma</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
