import { CAR_GCO2_PER_KM } from "@/config/emissions";
import { GRID_CLASSIFICATION_THRESHOLDS } from "@/config/grid-thresholds";
import { USAGE_PROFILES, type UsageKey } from "@/config/usage-profiles";
import type { CarbonPoint, GridClassification, HistoryStats } from "@/lib/carbonSchema";

export interface CarbonResult {
  gco2eq: number;
  kgco2eq: number;
  carKmEquiv: number;
}

function assertNonNegative(value: number, label: string): void {
  if (value < 0) {
    throw new RangeError(`${label} must be non-negative`);
  }
}

/** Empreinte d'une consommation : gco2eq = energyKwh × intensityGco2PerKwh. */
export function computeCarbonFootprint(
  energyKwh: number,
  intensityGco2PerKwh: number
): CarbonResult {
  assertNonNegative(energyKwh, "energyKwh");
  assertNonNegative(intensityGco2PerKwh, "intensityGco2PerKwh");

  const gco2eq = energyKwh * intensityGco2PerKwh;
  return {
    gco2eq,
    kgco2eq: gco2eq / 1000,
    carKmEquiv: gco2eq / CAR_GCO2_PER_KM,
  };
}

/** Empreinte d'un usage catalogué (USAGE_PROFILES) sur une durée donnée. */
export function computeUsageFootprint(
  usage: UsageKey,
  hours: number,
  intensityGco2PerKwh: number
): CarbonResult {
  assertNonNegative(hours, "hours");
  const energyKwh = USAGE_PROFILES[usage].kwhPerHour * hours;
  return computeCarbonFootprint(energyKwh, intensityGco2PerKwh);
}

/** Convertit une puissance (watts) en kWh/h, pour un appareil personnalisé. */
export function wattsToKwhPerHour(watts: number): number {
  assertNonNegative(watts, "watts");
  return watts / 1000;
}

/** Additionne plusieurs empreintes (gco2eq, kgco2eq, carKmEquiv). */
export function sumFootprints(results: CarbonResult[]): CarbonResult {
  return results.reduce<CarbonResult>(
    (total, result) => ({
      gco2eq: total.gco2eq + result.gco2eq,
      kgco2eq: total.kgco2eq + result.kgco2eq,
      carKmEquiv: total.carKmEquiv + result.carKmEquiv,
    }),
    { gco2eq: 0, kgco2eq: 0, carKmEquiv: 0 }
  );
}

/** Classifie une intensité carbone réseau en vert / modéré / élevé. */
export function classifyGridIntensity(co2: number): GridClassification {
  if (co2 <= GRID_CLASSIFICATION_THRESHOLDS.green) return "vert";
  if (co2 <= GRID_CLASSIFICATION_THRESHOLDS.moderate) return "modere";
  return "eleve";
}

/** Min / max / moyenne d'une série de points 24h (pour l'annotation du graphique). */
export function summarizeHistory(history: CarbonPoint[]): HistoryStats {
  if (history.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }
  const values = history.map((point) => point.co2);
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: Math.round(sum / values.length),
  };
}

/** Convertit des grammes de CO2eq en kilogrammes, pour l'affichage. */
export function toKilograms(grams: number): number {
  return grams / 1000;
}
