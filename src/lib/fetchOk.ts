/**
 * `fetch` qui lève une erreur explicite si la réponse n'est pas 2xx.
 * Évite de répéter le garde `if (!response.ok) throw` dans chaque appelant
 * (et l'imbrication qui va avec).
 */
export async function fetchOk(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response;
}
