import { z } from "zod";

export class ApiFetchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
  }
}

/** Récupère une ressource JSON et valide sa forme via un schéma Zod avant de la retourner. */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new ApiFetchError(
      `Network error while fetching ${url}: ${(error as Error).message}`
    );
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

  return result.data;
}
