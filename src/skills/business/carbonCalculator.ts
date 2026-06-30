/** Convertit une consommation (kWh) en émissions estimées (gCO2eq), selon l'intensité carbone du réseau (gCO2/kWh). */
export function calculateEmissions(kWh: number, gCO2PerKWh: number): number {
  if (kWh < 0 || gCO2PerKWh < 0) {
    throw new RangeError("kWh and gCO2PerKWh must be non-negative");
  }
  return kWh * gCO2PerKWh;
}

/** Convertit des grammes de CO2eq en kilogrammes, pour l'affichage. */
export function toKilograms(grams: number): number {
  return grams / 1000;
}
