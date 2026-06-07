import { describe, it, expect } from "vitest";
import { ehTransitorio, retrySupabase, retryAsync, criarLimitador } from "@/lib/resiliencia";

describe("ehTransitorio", () => {
  it("429 e 5xx são transitórios", () => {
    expect(ehTransitorio(429)).toBe(true);
    expect(ehTransitorio(503)).toBe(true);
    expect(ehTransitorio(500)).toBe(true);
  });
  it("4xx de negócio NÃO são transitórios", () => {
    expect(ehTransitorio(400)).toBe(false);
    expect(ehTransitorio(401)).toBe(false);
    expect(ehTransitorio(404)).toBe(false);
  });
  it("mensagens de rate limit/rede são transitórias", () => {
    expect(ehTransitorio(undefined, new Error("Too Many Requests - rate limit"))).toBe(true);
    expect(ehTransitorio(undefined, "fetch failed")).toBe(true);
  });
});

describe("retrySupabase", () => {
  it("repete em 429 e retorna sucesso", async () => {
    let n = 0;
    const res = await retrySupabase(
      async () => {
        n++;
        if (n < 3) return { data: null, error: { status: 429, message: "rate limit" } };
        return { data: { ok: true }, error: null };
      },
      { baseMs: 1, maxMs: 3, tentativas: 5 },
    );
    expect(n).toBe(3);
    expect(res.error).toBeNull();
    expect(res.data).toEqual({ ok: true });
  });

  it("NÃO repete erro de negócio (400)", async () => {
    let n = 0;
    const res = await retrySupabase(
      async () => {
        n++;
        return { data: null, error: { status: 400, message: "credencial inválida" } };
      },
      { baseMs: 1, tentativas: 5 },
    );
    expect(n).toBe(1);
    expect(res.error?.status).toBe(400);
  });

  it("respeita o teto de tentativas (sem loop infinito)", async () => {
    let n = 0;
    await retrySupabase(
      async () => {
        n++;
        return { data: null, error: { status: 429, message: "rate limit" } };
      },
      { baseMs: 1, maxMs: 3, tentativas: 4 },
    );
    expect(n).toBe(4);
  });
});

describe("retryAsync", () => {
  it("repete função que lança transitório e depois sucede", async () => {
    let n = 0;
    const v = await retryAsync(
      async () => {
        n++;
        if (n < 2) {
          const e = new Error("temporariamente indisponível") as Error & { status?: number };
          e.status = 503;
          throw e;
        }
        return "ok";
      },
      { baseMs: 1, tentativas: 3 },
    );
    expect(v).toBe("ok");
    expect(n).toBe(2);
  });

  it("propaga erro não-transitório sem repetir", async () => {
    let n = 0;
    await expect(
      retryAsync(
        async () => {
          n++;
          const e = new Error("inválido") as Error & { status?: number };
          e.status = 400;
          throw e;
        },
        { baseMs: 1, tentativas: 3 },
      ),
    ).rejects.toThrow("inválido");
    expect(n).toBe(1);
  });
});

describe("criarLimitador", () => {
  it("nunca excede a concorrência máxima", async () => {
    const limitar = criarLimitador(2);
    let ativos = 0;
    let pico = 0;
    const tarefa = () =>
      limitar(async () => {
        ativos++;
        pico = Math.max(pico, ativos);
        await new Promise((r) => setTimeout(r, 5));
        ativos--;
      });
    await Promise.all(Array.from({ length: 6 }, tarefa));
    expect(pico).toBeLessThanOrEqual(2);
  });
});
