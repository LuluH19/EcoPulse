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

async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function readCache<T>(url: string, schema: z.ZodType<T>, cacheTtlMs: number): T | undefined {
  if (cacheTtlMs <= 0) return undefined;
  const cached = cache.get(url);
  if (!cached || cached.expiresAt <= Date.now()) return undefined;
  return schema.parse(cached.payload);
}

/** Vérifie le statut HTTP puis valide le corps via le schéma Zod. */
async function parseValidatedResponse<T>(
  url: string,
  response: Response,
  schema: z.ZodType<T>
): Promise<T> {
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

  return result.data;
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

  const cached = readCache(url, schema, cacheTtlMs);
  if (cached !== undefined) return cached;

  try {
    const response = await fetchWithTimeout(url, init, timeoutMs);
    const data = await parseValidatedResponse(url, response, schema);

    if (cacheTtlMs > 0) {
      cache.set(url, { payload: data, expiresAt: Date.now() + cacheTtlMs });
    }

    return data;
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
