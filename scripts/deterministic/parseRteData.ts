import { z } from "zod";
import type { CarbonIntensityPoint } from "@/lib/types";

const RteRecordSchema = z.object({
  fields: z.object({
    date_heure: z.string(),
    taux_co2: z.number().nullable().optional(),
  }),
});

export const RteApiResponseSchema = z.object({
  records: z.array(RteRecordSchema),
});

export type RteApiResponse = z.infer<typeof RteApiResponseSchema>;

/**
 * Nettoie et standardise le flux brut Éco2mix de RTE : écarte les relevés sans
 * taux de CO2 et trie les points par ordre chronologique croissant pour le graphique.
 */
export function parseRteData(raw: RteApiResponse): CarbonIntensityPoint[] {
  return raw.records
    .flatMap((record) => {
      const { date_heure, taux_co2 } = record.fields;
      return typeof taux_co2 === "number"
        ? [{ timestamp: date_heure, gCO2PerKWh: taux_co2 }]
        : [];
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
