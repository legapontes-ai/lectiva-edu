import { describe, it, expect } from "vitest";
import {
  can,
  PERMISSAO_ADMIN_FULL,
  PERMISSOES_POR_PERFIL,
  PERFIS,
} from "@/lib/auth/permissions";

/**
 * Cobertura do "bridge" gerenciar -> ver em can() e dos perfis seed.
 * (O arquivo src/lib/auth/permissions.test.ts cobre os casos básicos; aqui
 * focamos na regra implícita "<mod>.gerenciar" concede "<mod>.ver".)
 */
describe("can() — bridge gerenciar -> ver", () => {
  it("'<mod>.gerenciar' concede implicitamente '<mod>.ver'", () => {
    expect(can(["financeiro.gerenciar"], "financeiro.ver")).toBe(true);
    expect(can(["avaliacao.gerenciar"], "avaliacao.ver")).toBe(true);
    expect(can(["alunos.gerenciar"], "alunos.ver")).toBe(true);
    expect(can(["cursos.gerenciar"], "cursos.ver")).toBe(true);
    expect(can(["disciplinas.gerenciar"], "disciplinas.ver")).toBe(true);
    expect(can(["professores.gerenciar"], "professores.ver")).toBe(true);
  });

  it("o bridge NÃO funciona na direção inversa ('.ver' não concede '.gerenciar')", () => {
    expect(can(["financeiro.ver"], "financeiro.gerenciar")).toBe(false);
    expect(can(["alunos.ver"], "alunos.gerenciar")).toBe(false);
    expect(can(["cursos.ver"], "cursos.gerenciar")).toBe(false);
  });

  it("o bridge não cruza módulos diferentes", () => {
    expect(can(["financeiro.gerenciar"], "alunos.ver")).toBe(false);
    expect(can(["cursos.gerenciar"], "disciplinas.ver")).toBe(false);
  });

  it("o bridge só se aplica ao sufixo '.ver' (outras ações não são derivadas)", () => {
    // "certificados.gerenciar" não deve conceder "certificados.validar".
    expect(can(["certificados.gerenciar"], "certificados.validar")).toBe(false);
    expect(can(["certificados.gerenciar"], "certificados.baixar")).toBe(false);
  });

  it("admin.full continua concedendo até as permissões '.ver'", () => {
    expect(can([PERMISSAO_ADMIN_FULL], "financeiro.ver")).toBe(true);
    expect(can([PERMISSAO_ADMIN_FULL], "dashboard.ver")).toBe(true);
    expect(can([PERMISSAO_ADMIN_FULL], "relatorios.ver")).toBe(true);
  });

  it("conjunto vazio nega qualquer permissão", () => {
    expect(can([], "dashboard.ver")).toBe(false);
    expect(can(new Set<string>(), "financeiro.ver")).toBe(false);
  });
});

describe("PERMISSOES_POR_PERFIL — derivações pelo bridge", () => {
  it("coordenação enxerga avaliação (via avaliacao.gerenciar)", () => {
    const perms = PERMISSOES_POR_PERFIL[PERFIS.COORDENACAO];
    expect(can(perms, "avaliacao.ver")).toBe(true);
    expect(can(perms, "dashboard.ver")).toBe(true);
  });

  it("professor com avaliacao.gerenciar também vê avaliacao", () => {
    const perms = PERMISSOES_POR_PERFIL[PERFIS.PROFESSOR];
    expect(can(perms, "avaliacao.ver")).toBe(true);
    expect(can(perms, "financeiro.ver")).toBe(false);
  });

  it("secretaria vê financeiro mas não o gerencia", () => {
    const perms = PERMISSOES_POR_PERFIL[PERFIS.SECRETARIA];
    expect(can(perms, "financeiro.ver")).toBe(true);
    expect(can(perms, "financeiro.gerenciar")).toBe(false);
  });
});
