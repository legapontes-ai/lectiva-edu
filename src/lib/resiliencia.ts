/**
 * Resiliência para chamadas à API externa (Supabase Auth/Storage, e-mail, gateway).
 *
 * - Retry com backoff exponencial + jitter.
 * - Trata 429 e 5xx (e falhas de rede) como **limitação temporária do servidor**
 *   (NÃO assume limite de conta) — apenas reduz a cadência e tenta de novo.
 * - Limitador de concorrência (semáforo) para não estourar o servidor.
 * - Teto de tentativas para evitar loops infinitos.
 * - Logs claros com rótulo da operação.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type RetryOpts = {
  /** Máximo de tentativas (inclui a primeira). Default 4. */
  tentativas?: number;
  /** Backoff base em ms. Default 300. */
  baseMs?: number;
  /** Teto do backoff em ms. Default 8000. */
  maxMs?: number;
  /** Rótulo para os logs. */
  rotulo?: string;
};

/** Considera transitório: 429, 5xx, ou erro de rede/timeout. */
export function ehTransitorio(status?: number | null, erro?: unknown): boolean {
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500 && status <= 599) return true;
  const msg = erro instanceof Error ? erro.message : typeof erro === "string" ? erro : "";
  return /rate.?limit|too many|timeout|temporar|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|fetch failed|network|503|429/i.test(
    msg,
  );
}

/** Backoff exponencial com jitter (full jitter parcial). Respeita Retry-After se informado. */
function calcularEspera(tentativa: number, baseMs: number, maxMs: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) return Math.min(retryAfterMs, maxMs);
  const teto = Math.min(maxMs, baseMs * 2 ** tentativa);
  const jitter = Math.random() * (teto / 2);
  return Math.round(teto / 2 + jitter);
}

/** Lê o header Retry-After (segundos ou data) de uma resposta fetch, em ms. */
export function retryAfterMs(res: { headers?: { get(name: string): string | null } } | null | undefined): number | undefined {
  const v = res?.headers?.get?.("retry-after");
  if (!v) return undefined;
  const seg = Number(v);
  if (!Number.isNaN(seg)) return seg * 1000;
  const data = Date.parse(v);
  return Number.isNaN(data) ? undefined : Math.max(0, data - Date.now());
}

/** Retry para funções que LANÇAM em erro (ex.: fetch, gateway de pagamento). */
export async function retryAsync<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const { tentativas = 4, baseMs = 300, maxMs = 8000, rotulo = "api" } = opts;
  let ultimo: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      const status = (e as { status?: number; statusCode?: number })?.status ?? (e as { statusCode?: number })?.statusCode;
      if (i === tentativas - 1 || !ehTransitorio(status, e)) throw e;
      const espera = calcularEspera(i, baseMs, maxMs);
      console.warn(`[resiliencia] ${rotulo}: tentativa ${i + 1}/${tentativas} falhou (transitório). Aguardando ${espera}ms.`);
      await sleep(espera);
    }
  }
  throw ultimo;
}

type ErroSupabase = { status?: number; message: string } | null;

/**
 * Retry para o padrão do Supabase `{ data, error }` (não lança).
 * Só repete em erro transitório (429/5xx); erros de negócio (ex.: credencial
 * inválida) retornam de imediato, sem retry.
 */
export async function retrySupabase<R extends { error: ErroSupabase }>(
  fn: () => Promise<R>,
  opts: RetryOpts = {},
): Promise<R> {
  const { tentativas = 4, baseMs = 300, maxMs = 8000, rotulo = "supabase" } = opts;
  let res = await fn();
  for (let i = 1; i < tentativas; i++) {
    if (!res.error || !ehTransitorio(res.error.status, res.error.message)) return res;
    const espera = calcularEspera(i - 1, baseMs, maxMs);
    console.warn(
      `[resiliencia] ${rotulo}: ${res.error.status ?? "erro"} transitório (limitação temporária do servidor, não é limite de conta). Retry ${i}/${tentativas - 1} em ${espera}ms.`,
    );
    await sleep(espera);
    res = await fn();
  }
  if (res.error && ehTransitorio(res.error.status, res.error.message)) {
    console.error(`[resiliencia] ${rotulo}: esgotou ${tentativas} tentativas após limitação temporária.`);
  }
  return res;
}

/**
 * Limitador de concorrência (semáforo). Garante no máximo `maxSimultaneo`
 * execuções em paralelo; o excedente entra em fila.
 */
export function criarLimitador(maxSimultaneo: number) {
  let ativos = 0;
  const fila: Array<() => void> = [];
  return async function limitar<T>(fn: () => Promise<T>): Promise<T> {
    if (ativos >= maxSimultaneo) {
      await new Promise<void>((resolve) => fila.push(resolve));
    }
    ativos++;
    try {
      return await fn();
    } finally {
      ativos--;
      fila.shift()?.();
    }
  };
}
