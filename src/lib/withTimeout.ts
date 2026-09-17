/**
 * Envolve uma promise (ex.: consulta ao Supabase) com um tempo limite.
 * Evita telas eternamente "carregando" quando o serviço de dados não responde.
 */
export const DEFAULT_QUERY_TIMEOUT_MS = 12000;

export class DataTimeoutError extends Error {
  constructor(label = 'dados') {
    super(`Tempo esgotado ao carregar ${label}.`);
    this.name = 'DataTimeoutError';
  }
}

export const withTimeout = <T>(
  promise: PromiseLike<T>,
  ms: number = DEFAULT_QUERY_TIMEOUT_MS,
  label = 'dados'
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new DataTimeoutError(label)), ms);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};
