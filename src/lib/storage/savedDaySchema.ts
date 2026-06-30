import { z } from "zod";

export const SavedDeviceSchema = z.object({
  label: z.string().min(1),
  kwhPerHour: z.number().nonnegative(),
  hours: z.number().nonnegative(),
  gco2eq: z.number().nonnegative(),
  custom: z.boolean(),
});

export const NewSavedDaySchema = z.object({
  intensityAtSave: z.number().nonnegative(),
  totalGco2eq: z.number().nonnegative(),
  devices: z.array(SavedDeviceSchema).min(1),
});

export type NewSavedDayInput = z.infer<typeof NewSavedDaySchema>;
