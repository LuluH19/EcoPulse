import { z } from "zod";

export class ApiFetchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
  }
}

/**
 * Récupère une ressource JSON et valide sa forme via un schéma Zod avant de la
 * retourner. Si le réseau est indisponible ou si la réponse ne correspond pas au
 * schéma, et qu'une donnée de repli `fallback` est fournie, celle-ci est retournée
 * à la place — validée elle aussi, pour garantir qu'elle reste propre et exploitable
 * par le reste de l'application.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const response = await fetch(url, init);
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
