import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Library, Search, ExternalLink } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser, temPermissao } from "@/lib/auth/dal";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { excluirMaterial } from "@/lib/biblioteca/actions";
import {
  TIPO_MATERIAL,
  BIBLIOGRAFIA,
  NIVEL_ACESSO,
  tipoUsaUrl,
} from "@/lib/validations/material";
import { rotulo } from "@/lib/enums";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/painel/page-header";
import { DeleteButton } from "@/components/painel/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const metadata: Metadata = { title: "Biblioteca virtual" };

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  await requireUser();
  const podeGerenciar = await temPermissao("biblioteca.gerenciar");
  const podeVer = podeGerenciar || (await temPermissao("materiais.ver"));
  if (!podeVer) redirect("/painel/acesso-negado");

  const { q, tipo } = await searchParams;
  const busca = q?.trim() ?? "";
  const tipoFiltro = TIPO_MATERIAL.some((t) => t.value === tipo) ? tipo : "";

  const where: Prisma.MaterialBibliotecaWhereInput = {};
  if (busca) {
    where.OR = [
      { titulo: { contains: busca, mode: "insensitive" } },
      { categoria: { contains: busca, mode: "insensitive" } },
    ];
  }
  if (tipoFiltro) {
    where.tipo = tipoFiltro as Prisma.MaterialBibliotecaWhereInput["tipo"];
  }

  const materiais = await prisma.materialBiblioteca.findMany({
    where,
    orderBy: { dataInclusao: "desc" },
    include: { disciplina: { select: { nome: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Biblioteca virtual"
        descricao="Acervo de livros, artigos, apostilas, vídeos e links de apoio."
        acao={
          podeGerenciar ? (
            <Button render={<Link href="/painel/biblioteca/novo" />}>
              <Plus className="size-4" /> Novo material
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="q" className="text-sm font-medium text-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="q"
                name="q"
                defaultValue={busca}
                placeholder="Título ou categoria"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-56">
            <label htmlFor="tipo" className="text-sm font-medium text-foreground">
              Tipo
            </label>
            <Select id="tipo" name="tipo" defaultValue={tipoFiltro}>
              <option value="">Todos os tipos</option>
              {TIPO_MATERIAL.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            {(busca || tipoFiltro) && (
              <Button variant="ghost" render={<Link href="/painel/biblioteca" />}>
                Limpar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {materiais.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Library className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {busca || tipoFiltro
              ? "Nenhum material encontrado para os filtros aplicados."
              : "Nenhum material cadastrado ainda."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Disciplina</th>
                  <th className="px-4 py-3 font-semibold">Bibliografia</th>
                  <th className="px-4 py-3 font-semibold">Acesso</th>
                  <th className="px-4 py-3 font-semibold">Incluído em</th>
                  {podeGerenciar && (
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {materiais.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        {m.titulo}
                        {tipoUsaUrl(m.tipo) && m.arquivoUrl && (
                          <a
                            href={m.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link"
                            title="Abrir link"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                      {m.autor && (
                        <div className="text-xs text-muted-foreground">{m.autor}</div>
                      )}
                      {m.categoria && (
                        <div className="text-xs text-muted-foreground">{m.categoria}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {rotulo(TIPO_MATERIAL, m.tipo)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.disciplina?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.bibliografia ? (
                        <Badge variant={m.bibliografia === "Basica" ? "info" : "muted"}>
                          {rotulo(BIBLIOGRAFIA, m.bibliografia)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={m.nivelAcesso === "Publico" ? "success" : "warning"}>
                        {rotulo(NIVEL_ACESSO, m.nivelAcesso)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatarData(m.dataInclusao)}
                    </td>
                    {podeGerenciar && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            render={<Link href={`/painel/biblioteca/${m.id}`} />}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton action={excluirMaterial.bind(null, m.id)} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
