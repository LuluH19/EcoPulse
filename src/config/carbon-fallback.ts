import type { CarbonPoint } from "@/lib/carbonSchema";

/**
 * Courbe statique servie quand aucune source live (Electricity Maps) n'est
 * disponible. Profil plausible pour le réseau français (creux nucléaire la
 * nuit, pointe gaz le soir).
 */
export const CARBON_FALLBACK: CarbonPoint[] = [
  { time: "00:00", co2: 32 },
  { time: "04:00", co2: 28 },
  { time: "08:00", co2: 55 },
  { time: "12:00", co2: 48 },
  { time: "16:00", co2: 60 },
  { time: "20:00", co2: 72 },
];
