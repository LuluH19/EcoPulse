import { z } from "zod";

export const CarbonPointSchema = z.object({
  time: z.string(),
  co2: z.number(),
});

export type CarbonPoint = z.infer<typeof CarbonPointSchema>;

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
  history: z.array(CarbonPointSchema),
  stats: HistoryStatsSchema,
  source: z.enum(["live", "fallback"]),
});

export type CarbonLive = z.infer<typeof carbonLiveSchema>;
