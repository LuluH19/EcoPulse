import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const ANON_ID_COOKIE = "ecopulse_anon_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Lit le cookie ecopulse_anon_id (UUID v4 anonyme, sans donnée personnelle)
 * ou le crée s'il est absent. Sert de clé d'appartenance des journées
 * enregistrées, en l'absence de tout système d'auth.
 */
export async function getOrCreateAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_ID_COOKIE)?.value;
  if (existing) return existing;

  const anonId = randomUUID();
  cookieStore.set(ANON_ID_COOKIE, anonId, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  });
  return anonId;
}
