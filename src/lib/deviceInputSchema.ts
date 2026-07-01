import { z } from "zod";
import {
  DEVICE_WATTS_BOUNDS,
  DEVICE_LABEL_MAX_LENGTH,
} from "@/config/device-input";

/**
 * Contrat Zod d'une entrée « appareil personnalisé » du simulateur, à partir des
 * champs bruts du formulaire (le champ watts arrive en `string`). Watts
 * strictement positifs et sous la borne anti-aberrant ; libellé nettoyé et borné.
 */
export const DeviceInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Nom d'appareil requis.")
    .max(DEVICE_LABEL_MAX_LENGTH, "Nom d'appareil trop long."),
  watts: z.coerce
    .number()
    .refine(Number.isFinite, "Puissance invalide.")
    .min(DEVICE_WATTS_BOUNDS.min, "La puissance doit être strictement positive.")
    .max(DEVICE_WATTS_BOUNDS.max, "Puissance aberrante : valeur trop élevée."),
});

export type DeviceInput = z.infer<typeof DeviceInputSchema>;

export interface SanitizeResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Valide et nettoie une saisie d'appareil. Ne lève jamais : renvoie un résultat
 * standardisé `{ success, data, error }` (Zéro crash — dataSanitizer.md §4).
 */
export function sanitizeDeviceInput(input: {
  label: string;
  watts: string;
}): SanitizeResult<DeviceInput> {
  const parsed = DeviceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide.",
    };
  }
  return { success: true, data: parsed.data, error: null };
}
