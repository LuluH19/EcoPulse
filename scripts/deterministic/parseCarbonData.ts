// Zéro import projet, volontairement (ARCHITECTURE.md §4) : ce script doit
// rester pur et trivial à tester. Les seuils ci-dessous dupliquent donc
// PLAUSIBLE_RANGE / WINDOW_HOURS de src/config/grid-thresholds.ts.
const PLAUSIBLE_MIN_GCO2 = 1;
const PLAUSIBLE_MAX_GCO2 = 1200;
const WINDOW_HOURS = 24;

export interface CarbonPoint {
  time: string;
  co2: number;
}

function extractTimestamp(record: Record<string, unknown>): string | undefined {
  return typeof record.datetime === "string" ? record.datetime : undefined;
}

function extractCo2(record: Record<string, unknown>): number | undefined {
  return typeof record.carbonIntensity === "number" &&
    Number.isFinite(record.carbonIntensity)
    ? record.carbonIntensity
    : undefined;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Nettoie et standardise le flux brut d'intensité carbone réseau
 * (Electricity Maps, `history[].{datetime,carbonIntensity}`) : écarte les
 * points absents/non numériques/hors plage plausible/hors fenêtre 24h, et
 * trie le résultat par ordre chronologique croissant.
 */
export function parseCarbonData(raw: unknown): CarbonPoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const now = Date.now();
  const windowStart = now - WINDOW_HOURS * 60 * 60 * 1000;

  const points = raw.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;

    const rawTimestamp = extractTimestamp(record);
    if (!rawTimestamp) return [];

    const date = new Date(rawTimestamp);
    const timestampMs = date.getTime();
    if (Number.isNaN(timestampMs)) return [];
    if (timestampMs < windowStart || timestampMs > now) return [];

    const co2 = extractCo2(record);
    if (co2 === undefined) return [];
    if (co2 < PLAUSIBLE_MIN_GCO2 || co2 > PLAUSIBLE_MAX_GCO2) return [];

    return [{ date, co2: Math.round(co2) }];
  });

  return points
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, co2 }) => ({ time: formatTime(date), co2 }));
}
