import { z } from "zod";

export class ApiFetchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
  }
}

interface CacheEntry {
  payload: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export interface FetchValidatedOptions<T> {
  init?: RequestInit;
  /** Donnée de repli, validée puis retournée si la requête échoue. */
  fallback?: T;
  /** Délai avant abandon de la requête réseau. */
  timeoutMs?: number;
  /** Durée de vie du cache mémoire pour cette URL ; 0 désactive le cache. */
  cacheTtlMs?: number;
}

/**
 * Récupère une ressource JSON et valide sa forme via un schéma Zod avant de la
 * retourner. Gère un timeout réseau, un cache mémoire à durée de vie limitée
 * (clé = URL), et une donnée de repli (elle aussi validée) si le réseau est
 * indisponible ou si la réponse ne correspond pas au schéma.
 */
export async function fetchValidated<T>(
  url: string,
  schema: z.ZodType<T>,
  options: FetchValidatedOptions<T> = {}
): Promise<T> {
  const { init, fallback, timeoutMs = 8000, cacheTtlMs = 0 } = options;

  if (cacheTtlMs > 0) {
    const cached = cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return schema.parse(cached.payload);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new ApiFetchError(
        `Request to ${url} failed with status ${response.status}`,
        response.status
      );
    }

    const payload: unknown = await response.json();
    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new ApiFetchError(
        `Response from ${url} did not match the expected schema: ${result.error.message}`
      );
    }

    if (cacheTtlMs > 0) {
      cache.set(url, { payload, expiresAt: Date.now() + cacheTtlMs });
    }

    return result.data;
  } catch (error) {
    if (fallback === undefined) {
      throw error instanceof ApiFetchError
        ? error
        : new ApiFetchError(
            `Network error while fetching ${url}: ${(error as Error).message}`
          );
    }
    return schema.parse(fallback);
  }
}
