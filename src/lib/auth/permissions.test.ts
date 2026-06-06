import { describe, it, expect } from "vitest";
import {
  can,
  PERMISSAO_ADMIN_FULL,
  PERMISSOES_POR_PERFIL,
  PERFIS,
} from "./permissions";

describe("can()", () => {
  it("admin.full concede qualquer permissão", () => {
    expect(can([PERMISSAO_ADMIN_FULL], "financeiro.gerenciar")).toBe(true);
    expect(can([PERMISSAO_ADMIN_FULL], "lgpd.gerenciar")).toBe(true);
  });

  it("concede uma permissão presente no conjunto", () => {
    expect(can(["alunos.gerenciar", "relatorios.ver"], "alunos.gerenciar")).toBe(true);
  });

  it("nega uma permissão ausente", () => {
    expect(can(["alunos.ver"], "financeiro.gerenciar")).toBe(false);
  });

  it("aceita um Set como entrada", () => {
    expect(can(new Set(["dashboard.ver"]), "dashboard.ver")).toBe(true);
  });
});

describe("PERMISSOES_POR_PERFIL", () => {
  it("define os 5 perfis", () => {
    expect(Object.keys(PERMISSOES_POR_PERFIL)).toHaveLength(5);
  });

  it("o aluno acessa a própria área mas não gerencia usuários", () => {
    const perms = PERMISSOES_POR_PERFIL[PERFIS.ALUNO];
    expect(can(perms, "area_aluno.acessar")).toBe(true);
    expect(can(perms, "usuarios.gerenciar")).toBe(false);
  });
});
