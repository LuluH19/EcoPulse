import { NextResponse } from "next/server";
import { fetchValidated, ApiFetchError } from "@/skills/shared/apiFetcher";
import {
  parseCarbonData,
  type CarbonPoint,
} from "@scripts/deterministic/parseCarbonData";
import {
  classifyGridIntensity,
  summarizeHistory,
} from "@/skills/business/carbonCalculator";
import { carbonLiveSchema, type CarbonLive } from "@/lib/carbonSchema";
import { ElectricityMapsHistorySchema } from "@/lib/electricityMapsSchema";
import { CARBON_FALLBACK } from "@/config/carbon-fallback";
import {
  ELECTRICITY_MAPS_CACHE_TTL_MS,
  ELECTRICITY_MAPS_HISTORY_URL,
  ELECTRICITY_MAPS_TIMEOUT_MS,
  ELECTRICITY_MAPS_ZONE,
} from "@/config/electricity-maps";

export const revalidate = 900;

/**
 * Source live unique. Renvoie un tableau vide (jamais une erreur non gérée)
 * si la clé n'est pas configurée ou si la requête échoue : l'appelant bascule
 * alors sur CARBON_FALLBACK.
 */
async function fetchLiveCarbonIntensity(): Promise<CarbonPoint[]> {
  const apiKey = process.env.ELECTRICITY_MAPS_API_KEY;
  if (!apiKey) return [];

  const url = `${ELECTRICITY_MAPS_HISTORY_URL}?zone=${ELECTRICITY_MAPS_ZONE}`;
  const init: RequestInit = { headers: { "auth-token": apiKey } };
  try {
    const raw = await fetchValidated(url, ElectricityMapsHistorySchema, {
      init,
      timeoutMs: ELECTRICITY_MAPS_TIMEOUT_MS,
      cacheTtlMs: ELECTRICITY_MAPS_CACHE_TTL_MS,
    });
    return parseCarbonData(raw.history);
  } catch (error) {
    if (!(error instanceof ApiFetchError)) {
      throw error;
    }
    console.error("[api/carbon/live] Electricity Maps fetch failed", error);
    return [];
  }
}

export async function GET(): Promise<NextResponse> {
  const live = await fetchLiveCarbonIntensity();
  const history = live.length > 0 ? live : CARBON_FALLBACK;
  const source: CarbonLive["source"] = live.length > 0 ? "live" : "fallback";

  const latest = history.at(-1)!;
  const body: CarbonLive = {
    current: {
      co2: latest.co2,
      time: latest.time,
      classification: classifyGridIntensity(latest.co2),
    },
    history,
    stats: summarizeHistory(history),
    source,
  };

  return NextResponse.json(carbonLiveSchema.parse(body), { status: 200 });
}
