// Zéro import projet, volontairement (ARCHITECTURE.md §4) : ce script doit
// rester pur et trivial à tester. Les seuils ci-dessous dupliquent donc
// PLAUSIBLE_RANGE / WINDOW_HOURS de src/config/grid-thresholds.ts.
const PLAUSIBLE_MIN_GCO2 = 1;
const PLAUSIBLE_MAX_GCO2 = 1200;
const WINDOW_HOURS = 24;

export interface RtePoint {
  time: string;
  co2: number;
}

function extractTimestamp(record: Record<string, unknown>): string | undefined {
  if (typeof record.date_heure === "string") return record.date_heure;
  if (typeof record.timestamp === "string") return record.timestamp;
  if (typeof record.datetime === "string") return record.datetime;
  if (typeof record.date === "string" && typeof record.heure === "string") {
    return `${record.date}T${record.heure}`;
  }
  if (typeof record.date === "string") return record.date;
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function extractCo2(record: Record<string, unknown>): number | undefined {
  return (
    toNumber(record.taux_co2) ??
    toNumber(record.value) ??
    toNumber(record.co2) ??
    toNumber(record.carbonIntensity)
  );
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Nettoie et standardise un flux brut de données d'intensité carbone réseau,
 * quelle que soit la source (RTE/ODRÉ ou Electricity Maps) : extrait
 * horodatage + taux de CO2 (plusieurs noms de champs possibles selon la
 * source), écarte les points absents/non numériques/hors plage
 * plausible/hors fenêtre 24h, et trie le résultat par ordre chronologique
 * croissant.
 */
export function parseRteData(raw: unknown): RtePoint[] {
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
