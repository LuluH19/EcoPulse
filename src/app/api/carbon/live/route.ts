import { NextResponse } from "next/server";
import { fetchJson, ApiFetchError } from "@/skills/shared/apiFetcher";
import {
  parseRteData,
  RteApiResponseSchema,
  type RteApiResponse,
} from "@scripts/deterministic/parseRteData";

const RTE_ECO2MIX_URL =
  "https://odre.opendatasoft.com/api/records/1.0/search/?dataset=eco2mix-national-tr&rows=50&sort=-date_heure";

const FALLBACK_INTERVAL_MINUTES = 15;
// Valeurs plausibles de taux_co2 (gCO2eq/kWh) pour le mix électrique français,
// utilisées uniquement si l'API RTE est inaccessible.
const FALLBACK_TAUX_CO2 = [52, 49, 47, 50, 55, 58];

function buildFallbackRteData(): RteApiResponse {
  const now = Date.now();
  return {
    records: FALLBACK_TAUX_CO2.map((taux_co2, index) => ({
      fields: {
        date_heure: new Date(
          now -
            (FALLBACK_TAUX_CO2.length - index) *
              FALLBACK_INTERVAL_MINUTES *
              60_000
        ).toISOString(),
        taux_co2,
      },
    })),
  };
}

export async function GET() {
  try {
    const raw = await fetchJson(
      RTE_ECO2MIX_URL,
      RteApiResponseSchema,
      { next: { revalidate: 60 } },
      buildFallbackRteData()
    );
    return NextResponse.json(parseRteData(raw));
  } catch (error) {
    const message =
      error instanceof ApiFetchError ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
