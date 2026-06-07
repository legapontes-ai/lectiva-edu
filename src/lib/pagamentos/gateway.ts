import { MockGateway } from "./mock-gateway";

/** Status normalizado de uma cobrança, independente do provedor. */
export type StatusCobranca = "pendente" | "pago" | "vencido";

/** Dados necessários para abrir uma cobrança no provedor. */
export type CriarCobrancaInput = {
  valor: number;
  vencimento: Date;
  descricao: string;
  idParcela: string;
};

/** Retorno padronizado da criação de cobrança. */
export type CriarCobrancaResultado = {
  idExterno: string;
  linkPagamento: string;
  linhaDigitavel?: string;
};

/**
 * Contrato que todo provedor de pagamento (Asaas, Pagar.me, Stripe, etc.)
 * deve implementar. O restante do sistema depende apenas desta interface.
 */
export interface GatewayPagamento {
  criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado>;
  consultarStatus(idExterno: string): Promise<StatusCobranca>;
}

/**
 * Fábrica do provedor de pagamento. Lê PAYMENT_PROVIDER do ambiente
 * (default "mock"). Para plugar um provedor real, implemente
 * GatewayPagamento e adicione o case correspondente abaixo.
 */
export function getGateway(): GatewayPagamento {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "mock":
      return new MockGateway();
    // case "asaas":
    //   return new AsaasGateway();
    // case "pagarme":
    //   return new PagarmeGateway();
    // case "stripe":
    //   return new StripeGateway();
    default:
      // Provedor desconhecido: cai no mock para não quebrar o fluxo.
      return new MockGateway();
  }
}
