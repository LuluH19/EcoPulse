import { NetworkError } from "@/lib/errors";

/**
 * `fetch` qui lève une `NetworkError` typée si l'hôte est injoignable ou si la
 * réponse n'est pas 2xx. Évite de répéter le garde `if (!response.ok) throw`
 * dans chaque appelant (et l'imbrication qui va avec).
 */
export async function fetchOk(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new NetworkError(
      `Réseau indisponible : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new NetworkError(
      `HTTP ${response.status}`,
      response.status,
      `ERR_HTTP_${response.status}`
    );
  }
  return response;
}
