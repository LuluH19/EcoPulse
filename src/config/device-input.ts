/**
 * Bornes de saisie d'un appareil personnalisé du simulateur.
 * `min` strictement positif : une puissance nulle ou négative n'a pas de sens.
 * `max` : garde-fou anti-aberrant (typo type « 999999 » W).
 */
export const DEVICE_WATTS_BOUNDS = { min: 1, max: 10000 } as const;

/** Longueur max du libellé d'un appareil (évite les chaînes démesurées). */
export const DEVICE_LABEL_MAX_LENGTH = 40;
