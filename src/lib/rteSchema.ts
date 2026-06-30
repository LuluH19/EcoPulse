import { z } from "zod";

/**
 * Forme brute d'un relevé RTE. Plusieurs sources possibles (ODRÉ, l'API
 * officielle data.rte-france.com) utilisent des noms de champs différents pour
 * la même donnée — tous les champs sont donc optionnels ici, et
 * `parseRteData` choisit lequel utiliser. `.passthrough()` tolère les champs
 * non consommés (consommation, nucleaire, etc.) sans les valider.
 */
const RteRawRecordSchema = z
  .object({
    date_heure: z.string().optional(),
    timestamp: z.string().optional(),
    date: z.string().optional(),
    heure: z.string().optional(),
    taux_co2: z.union([z.number(), z.string()]).nullable().optional(),
    value: z.union([z.number(), z.string()]).nullable().optional(),
    co2: z.union([z.number(), z.string()]).nullable().optional(),
  })
  .passthrough();

export const RteApiResponseSchema = z.object({
  results: z.array(RteRawRecordSchema),
});

export type RteRawRecord = z.infer<typeof RteRawRecordSchema>;
export type RteApiResponse = z.infer<typeof RteApiResponseSchema>;

export const RtePointSchema = z.object({
  time: z.string(),
  co2: z.number(),
});

export type RtePoint = z.infer<typeof RtePointSchema>;

export const GridClassificationSchema = z.enum(["vert", "modere", "eleve"]);
export type GridClassification = z.infer<typeof GridClassificationSchema>;

export const HistoryStatsSchema = z.object({
  min: z.number(),
  max: z.number(),
  average: z.number(),
});
export type HistoryStats = z.infer<typeof HistoryStatsSchema>;

export const carbonLiveSchema = z.object({
  current: z.object({
    co2: z.number(),
    time: z.string(),
    classification: GridClassificationSchema,
  }),
  history: z.array(RtePointSchema),
  stats: HistoryStatsSchema,
  source: z.enum(["live", "fallback"]),
});

export type CarbonLive = z.infer<typeof carbonLiveSchema>;
