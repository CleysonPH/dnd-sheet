import { Pool, type PoolClient } from "pg";

/*
 * Pool que repete a conexão quando ela cai antes de a consulta ser enviada
 * (design Y2). No plano free, o compute do Neon suspende depois de 5 minutos
 * parado, e a primeira conexão ao acordá-lo pode ser derrubada no TLS.
 * Repetir é seguro: nada chegou ao banco. Falhas durante a consulta não são
 * repetidas.
 */

const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);
const RETRYABLE_MESSAGE =
  /before secure TLS connection|Connection terminated|timeout expired/i;

/** Tentativas além da primeira e a espera antes de cada uma, em ms. */
export const CONNECT_RETRY_DELAYS = [200, 400];

export function isRetryableConnectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return (
    (typeof code === "string" && RETRYABLE_CODES.has(code)) ||
    RETRYABLE_MESSAGE.test(error.message)
  );
}

type ConnectCallback = (
  error: Error | undefined,
  client: PoolClient | undefined,
  done: (release?: unknown) => void,
) => void;

const noop = () => {};

export class RetryingPool extends Pool {
  private async connectWithRetry(): Promise<PoolClient> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await super.connect();
      } catch (error) {
        const delay = CONNECT_RETRY_DELAYS[attempt];
        if (delay === undefined || !isRetryableConnectError(error)) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  override connect(): Promise<PoolClient>;
  override connect(callback: ConnectCallback): void;
  // O pool.query do pg-pool usa a forma com callback.
  override connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const result = this.connectWithRetry();
    if (!callback) return result;
    result.then(
      (client) =>
        callback(undefined, client, (release) =>
          client.release(release as boolean | Error | undefined),
        ),
      (error: Error) => callback(error, undefined, noop),
    );
  }
}
