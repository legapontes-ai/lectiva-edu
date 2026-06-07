import type {
  GatewayPagamento,
  CriarCobrancaInput,
  CriarCobrancaResultado,
  StatusCobranca,
} from "./gateway";

/** Hash determinístico simples (FNV-like) -> hex, para gerar ids fake estáveis. */
function hashDeterministico(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Monta uma "linha digitável" fake (47 dígitos) determinística a partir de uma seed. */
function linhaDigitavelFake(seed: string): string {
  let out = "";
  let s = seed;
  while (out.length < 47) {
    s = hashDeterministico(s + out);
    out += parseInt(s, 16).toString().replace(/\D/g, "");
  }
  return out.slice(0, 47);
}

/**
 * Provedor MOCK para desenvolvimento e testes. Não chama nenhuma API externa:
 * gera idExterno, linkPagamento e linhaDigitavel determinísticos a partir do
 * idParcela e sempre retorna status "pendente".
 *
 * Para integrar um provedor real (Asaas / Pagar.me / Stripe), crie uma classe
 * análoga que implemente GatewayPagamento fazendo as chamadas HTTP reais e
 * registre-a no switch de getGateway() em ./gateway.ts.
 */
export class MockGateway implements GatewayPagamento {
  async criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado> {
    const seed = hashDeterministico(input.idParcela);
    const idExterno = `mock_${seed}`;
    const linkPagamento = `https://pagamentos.mock.lectiva.local/cobranca/${idExterno}`;
    const linhaDigitavel = linhaDigitavelFake(input.idParcela);
    return { idExterno, linkPagamento, linhaDigitavel };
  }

  async consultarStatus(_idExterno: string): Promise<StatusCobranca> {
    // No mock, cobranças permanecem pendentes até a baixa manual no painel.
    return "pendente";
  }
}
