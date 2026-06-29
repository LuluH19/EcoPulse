import { NextResponse } from "next/server";
import { fetchJson, ApiFetchError } from "@/lib/apiFetcher";
import { parseRteData, RteApiResponseSchema } from "@scripts/parseRteData";

const RTE_ECO2MIX_URL =
  "https://odre.opendatasoft.com/api/records/1.0/search/?dataset=eco2mix-national-tr&rows=50&sort=-date_heure";

export async function GET() {
  try {
    const raw = await fetchJson(RTE_ECO2MIX_URL, RteApiResponseSchema, {
      next: { revalidate: 60 },
    });
    return NextResponse.json(parseRteData(raw));
  } catch (error) {
    const message =
      error instanceof ApiFetchError ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
