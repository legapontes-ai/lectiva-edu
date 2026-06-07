import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getGateway, type CriarCobrancaInput } from "@/lib/pagamentos/gateway";
import { MockGateway } from "@/lib/pagamentos/mock-gateway";

const baseInput: CriarCobrancaInput = {
  valor: 1234.56,
  vencimento: new Date("2026-07-10T00:00:00Z"),
  descricao: "Parcela 1/12",
  idParcela: "parcela-abc-123",
};

describe("MockGateway.criarCobranca", () => {
  it("retorna idExterno e linkPagamento determinísticos a partir do idParcela", async () => {
    const gw = new MockGateway();
    const r1 = await gw.criarCobranca(baseInput);
    const r2 = await gw.criarCobranca(baseInput);

    expect(r1.idExterno).toBe(r2.idExterno);
    expect(r1.linkPagamento).toBe(r2.linkPagamento);
    expect(r1.linhaDigitavel).toBe(r2.linhaDigitavel);
  });

  it("o idExterno tem prefixo mock_ e o link o contém", async () => {
    const gw = new MockGateway();
    const r = await gw.criarCobranca(baseInput);

    expect(r.idExterno).toMatch(/^mock_[0-9a-f]{8}$/);
    expect(r.linkPagamento).toContain(r.idExterno);
    expect(r.linkPagamento.startsWith("https://")).toBe(true);
  });

  it("gera linha digitável de 47 dígitos numéricos", async () => {
    const gw = new MockGateway();
    const r = await gw.criarCobranca(baseInput);

    expect(r.linhaDigitavel).toBeDefined();
    expect(r.linhaDigitavel).toHaveLength(47);
    expect(r.linhaDigitavel).toMatch(/^\d{47}$/);
  });

  it("idParcelas diferentes geram idExterno diferentes", async () => {
    const gw = new MockGateway();
    const a = await gw.criarCobranca({ ...baseInput, idParcela: "parcela-A" });
    const b = await gw.criarCobranca({ ...baseInput, idParcela: "parcela-B" });

    expect(a.idExterno).not.toBe(b.idExterno);
    expect(a.linhaDigitavel).not.toBe(b.linhaDigitavel);
  });

  it("o idExterno depende apenas do idParcela (não de valor/descrição/vencimento)", async () => {
    const gw = new MockGateway();
    const a = await gw.criarCobranca(baseInput);
    const b = await gw.criarCobranca({
      ...baseInput,
      valor: 9999.99,
      descricao: "Outra descrição",
      vencimento: new Date("2030-01-01T00:00:00Z"),
    });

    expect(a.idExterno).toBe(b.idExterno);
  });
});

describe("MockGateway.consultarStatus", () => {
  it("sempre retorna 'pendente' no mock", async () => {
    const gw = new MockGateway();
    await expect(gw.consultarStatus("mock_qualquer")).resolves.toBe("pendente");
  });
});

describe("getGateway()", () => {
  const prev = process.env.PAYMENT_PROVIDER;

  beforeEach(() => {
    delete process.env.PAYMENT_PROVIDER;
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.PAYMENT_PROVIDER;
    else process.env.PAYMENT_PROVIDER = prev;
  });

  it("retorna MockGateway por padrão (sem PAYMENT_PROVIDER)", () => {
    expect(getGateway()).toBeInstanceOf(MockGateway);
  });

  it("retorna MockGateway quando PAYMENT_PROVIDER=mock", () => {
    process.env.PAYMENT_PROVIDER = "mock";
    expect(getGateway()).toBeInstanceOf(MockGateway);
  });

  it("é case-insensitive para o nome do provedor", () => {
    process.env.PAYMENT_PROVIDER = "MOCK";
    expect(getGateway()).toBeInstanceOf(MockGateway);
  });

  it("cai no mock para provedor desconhecido (não quebra o fluxo)", () => {
    process.env.PAYMENT_PROVIDER = "provedor-inexistente";
    expect(getGateway()).toBeInstanceOf(MockGateway);
  });
});
