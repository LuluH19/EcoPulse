import { NextResponse } from "next/server";
import { fetchValidated, ApiFetchError } from "@/skills/shared/apiFetcher";
import { parseRteData } from "@scripts/deterministic/parseRteData";
import {
  classifyGridIntensity,
  summarizeHistory,
} from "@/skills/business/carbonCalculator";
import {
  RteApiResponseSchema,
  carbonLiveSchema,
  type CarbonLive,
} from "@/lib/rteSchema";
import { RTE_CACHE_TTL_MS, RTE_FETCH_TIMEOUT_MS } from "@/config/rte-fetch";
import { RTE_FALLBACK } from "@/config/rte-fallback";

// L'API v2.1 plafonne `limit` à 100 (au-delà : HTTP 400 InvalidRESTParameterError).
// 100 points à 15 min d'intervalle couvre déjà ~25h, suffisant pour la fenêtre 24h.
const RTE_ECO2MIX_URL =
  "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records?limit=100&order_by=date_heure%20desc";

export const revalidate = 900;

export async function GET(): Promise<NextResponse> {
  let history = RTE_FALLBACK;
  let source: CarbonLive["source"] = "fallback";

  try {
    const raw = await fetchValidated(RTE_ECO2MIX_URL, RteApiResponseSchema, {
      timeoutMs: RTE_FETCH_TIMEOUT_MS,
      cacheTtlMs: RTE_CACHE_TTL_MS,
    });
    const cleaned = parseRteData(raw.results);
    if (cleaned.length > 0) {
      history = cleaned;
      source = "live";
    }
  } catch (error) {
    if (!(error instanceof ApiFetchError)) {
      throw error;
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
