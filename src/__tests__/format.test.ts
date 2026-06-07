import { describe, it, expect } from "vitest";
import { formatarBRL, formatarData, formatarDataHora } from "@/lib/format";

/** Normaliza espaços (Intl pode usar NBSP/narrow-NBSP entre símbolo e valor). */
const norm = (s: string) => s.replace(/[  ]/g, " ");

describe("formatarBRL", () => {
  it("formata número em Real brasileiro (R$ x.xxx,xx)", () => {
    expect(norm(formatarBRL(1234.56))).toBe("R$ 1.234,56");
  });

  it("formata zero", () => {
    expect(norm(formatarBRL(0))).toBe("R$ 0,00");
  });

  it("aplica separador de milhar e sempre 2 casas decimais", () => {
    expect(norm(formatarBRL(1000000))).toBe("R$ 1.000.000,00");
    expect(norm(formatarBRL(5))).toBe("R$ 5,00");
  });

  it("formata valores negativos", () => {
    expect(norm(formatarBRL(-99.9))).toBe("-R$ 99,90");
  });

  it("aceita string numérica (Decimal do Prisma serializado)", () => {
    expect(norm(formatarBRL("2500.5"))).toBe("R$ 2.500,50");
  });

  it("sempre inicia com o símbolo R$", () => {
    expect(formatarBRL(42)).toContain("R$");
  });
});

describe("formatarData", () => {
  it("formata em dd/MM/yyyy no fuso America/Sao_Paulo", () => {
    expect(formatarData(new Date("2026-03-15T12:00:00Z"))).toBe("15/03/2026");
  });

  it("aceita string ISO", () => {
    expect(formatarData("2026-12-31T10:00:00Z")).toBe("31/12/2026");
  });

  it("respeita o fuso (UTC-3): pré-meia-noite UTC ainda é o dia anterior em SP", () => {
    // 2026-01-01T02:00:00Z -> 2025-12-31 23:00 em São Paulo.
    expect(formatarData("2026-01-01T02:00:00Z")).toBe("31/12/2025");
  });
});

describe("formatarDataHora", () => {
  it("formata em dd/MM/yyyy HH:mm no fuso de São Paulo", () => {
    // 12:00Z -> 09:00 em São Paulo (UTC-3).
    expect(formatarDataHora("2026-03-15T12:00:00Z")).toBe("15/03/2026 09:00");
  });
});
