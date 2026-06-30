import { NextResponse } from "next/server";
import { fetchValidated, ApiFetchError } from "@/skills/shared/apiFetcher";
import { parseRteData, type RtePoint } from "@scripts/deterministic/parseRteData";
import {
  classifyGridIntensity,
  summarizeHistory,
} from "@/skills/business/carbonCalculator";
import {
  RteApiResponseSchema,
  carbonLiveSchema,
  type CarbonLive,
} from "@/lib/rteSchema";
import { ElectricityMapsHistorySchema } from "@/lib/electricityMapsSchema";
import { RTE_CACHE_TTL_MS, RTE_FETCH_TIMEOUT_MS } from "@/config/rte-fetch";
import { RTE_FALLBACK } from "@/config/rte-fallback";
import {
  ELECTRICITY_MAPS_CACHE_TTL_MS,
  ELECTRICITY_MAPS_HISTORY_URL,
  ELECTRICITY_MAPS_TIMEOUT_MS,
  ELECTRICITY_MAPS_ZONE,
} from "@/config/electricity-maps";

// L'API v2.1 plafonne `limit` à 100 (au-delà : HTTP 400 InvalidRESTParameterError).
// 100 points à 15 min d'intervalle couvre déjà ~25h, suffisant pour la fenêtre 24h.
const RTE_ECO2MIX_URL =
  "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records?limit=100&order_by=date_heure%20desc";

export const revalidate = 900;

async function fetchFromRte(): Promise<RtePoint[]> {
  const raw = await fetchValidated(RTE_ECO2MIX_URL, RteApiResponseSchema, {
    timeoutMs: RTE_FETCH_TIMEOUT_MS,
    cacheTtlMs: RTE_CACHE_TTL_MS,
  });
  return parseRteData(raw.results);
}

/**
 * Source de secours en cas de panne RTE. Désactivée si aucune clé n'est
 * configurée (ELECTRICITY_MAPS_API_KEY) : on passe alors directement au
 * fallback statique.
 */
async function fetchFromElectricityMaps(): Promise<RtePoint[]> {
  const apiKey = process.env.ELECTRICITY_MAPS_API_KEY;
  if (!apiKey) return [];

  const url = `${ELECTRICITY_MAPS_HISTORY_URL}?zone=${ELECTRICITY_MAPS_ZONE}`;
  const raw = await fetchValidated(url, ElectricityMapsHistorySchema, {
    init: { headers: { "auth-token": apiKey } },
    timeoutMs: ELECTRICITY_MAPS_TIMEOUT_MS,
    cacheTtlMs: ELECTRICITY_MAPS_CACHE_TTL_MS,
  });
  return parseRteData(raw.history);
}

export async function GET(): Promise<NextResponse> {
  let history = RTE_FALLBACK;
  let source: CarbonLive["source"] = "fallback";

  for (const fetchSource of [fetchFromRte, fetchFromElectricityMaps]) {
    try {
      const cleaned = await fetchSource();
      if (cleaned.length > 0) {
        history = cleaned;
        source = "live";
        break;
      }
    } catch (error) {
      if (!(error instanceof ApiFetchError)) {
        throw error;
      }
    }
  }

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
