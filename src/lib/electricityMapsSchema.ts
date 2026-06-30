import { z } from "zod";

/**
 * Forme brute d'un point d'historique Electricity Maps
 * (GET /v3/carbon-intensity/history). `.passthrough()` tolère les champs non
 * consommés (updatedAt, emissionFactorType, isEstimated, etc.).
 */
const ElectricityMapsPointSchema = z
  .object({
    datetime: z.string(),
    carbonIntensity: z.number(),
  })
  .passthrough();

export const ElectricityMapsHistorySchema = z.object({
  zone: z.string().optional(),
  history: z.array(ElectricityMapsPointSchema),
});

export type ElectricityMapsHistory = z.infer<
  typeof ElectricityMapsHistorySchema
>;
