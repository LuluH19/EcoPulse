"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  computeCarbonFootprint,
  computeUsageFootprint,
  sumFootprints,
  wattsToKwhPerHour,
  type CarbonResult,
} from "@/skills/business/carbonCalculator";
import { USAGE_PROFILES, type UsageKey } from "@/config/usage-profiles";
import { DURATION_SLIDER_BOUNDS } from "@/config/duration-slider";
import { fetchOk } from "@/lib/fetchOk";
import type { NewSavedDay } from "@/lib/storage/storageAdapter";

export const CATALOG_KEYS = Object.keys(USAGE_PROFILES) as UsageKey[];

interface CatalogState {
  active: boolean;
  hours: number;
}

export interface CustomDevice {
  id: string;
  label: string;
  watts: number;
  hours: number;
  active: boolean;
}

interface ActiveEntry {
  label: string;
  kwhPerHour: number;
  hours: number;
  result: CarbonResult;
  custom: boolean;
}

interface UseImpactSimulator {
  catalogState: Record<UsageKey, CatalogState>;
  customDevices: CustomDevice[];
  isAdding: boolean;
  setIsAdding: Dispatch<SetStateAction<boolean>>;
  newLabel: string;
  setNewLabel: Dispatch<SetStateAction<string>>;
  newWatts: string;
  setNewWatts: Dispatch<SetStateAction<string>>;
  isSaving: boolean;
  saveError: string | null;
  activeEntries: ActiveEntry[];
  total: CarbonResult;
  toggleCatalog: (key: UsageKey, active: boolean) => void;
  setCatalogHours: (key: UsageKey, hours: number) => void;
  toggleCustom: (id: string, active: boolean) => void;
  setCustomHours: (id: string, hours: number) => void;
  removeCustom: (id: string) => void;
  handleAddDevice: () => void;
  handleSave: () => Promise<void>;
}

function createInitialCatalogState(): Record<UsageKey, CatalogState> {
  return Object.fromEntries(
    CATALOG_KEYS.map((key) => [key, { active: false, hours: 1 }])
  ) as Record<UsageKey, CatalogState>;
}

/**
 * Logique du simulateur d'impact : état du catalogue et des appareils
 * personnalisés, empreintes dérivées (via `carbonCalculator`) et sauvegarde.
 * Le composant ne fait plus que du rendu.
 */
export function useImpactSimulator(
  currentIntensity: number,
  onSaved: () => void
): UseImpactSimulator {
  const [catalogState, setCatalogState] = useState<
    Record<UsageKey, CatalogState>
  >(createInitialCatalogState);
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newWatts, setNewWatts] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const catalogEntries: ActiveEntry[] = CATALOG_KEYS.filter(
    (key) => catalogState[key].active
  ).map((key) => {
    const { hours } = catalogState[key];
    return {
      label: USAGE_PROFILES[key].label,
      kwhPerHour: USAGE_PROFILES[key].kwhPerHour,
      hours,
      result: computeUsageFootprint(key, hours, currentIntensity),
      custom: false,
    };
  });

  const customEntries: ActiveEntry[] = customDevices
    .filter((device) => device.active)
    .map((device) => {
      const kwhPerHour = wattsToKwhPerHour(device.watts);
      return {
        label: device.label,
        kwhPerHour,
        hours: device.hours,
        result: computeCarbonFootprint(
          kwhPerHour * device.hours,
          currentIntensity
        ),
        custom: true,
      };
    });

  const activeEntries = [...catalogEntries, ...customEntries];
  const total = sumFootprints(activeEntries.map((entry) => entry.result));

  function toggleCatalog(key: UsageKey, active: boolean): void {
    setCatalogState((prev) => ({ ...prev, [key]: { ...prev[key], active } }));
  }

  function setCatalogHours(key: UsageKey, hours: number): void {
    setCatalogState((prev) => ({ ...prev, [key]: { ...prev[key], hours } }));
  }

  function toggleCustom(id: string, active: boolean): void {
    setCustomDevices((prev) =>
      prev.map((device) => (device.id === id ? { ...device, active } : device))
    );
  }

  function setCustomHours(id: string, hours: number): void {
    setCustomDevices((prev) =>
      prev.map((device) => (device.id === id ? { ...device, hours } : device))
    );
  }

  function removeCustom(id: string): void {
    setCustomDevices((prev) => prev.filter((device) => device.id !== id));
  }

  function handleAddDevice(): void {
    const watts = Number(newWatts);
    if (!newLabel.trim() || !Number.isFinite(watts) || watts < 0) return;
    setCustomDevices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        watts,
        hours: DURATION_SLIDER_BOUNDS.min + DURATION_SLIDER_BOUNDS.step,
        active: true,
      },
    ]);
    setNewLabel("");
    setNewWatts("");
    setIsAdding(false);
  }

  async function handleSave(): Promise<void> {
    if (activeEntries.length === 0) return;

    const payload: NewSavedDay = {
      intensityAtSave: currentIntensity,
      totalGco2eq: total.gco2eq,
      devices: activeEntries.map((entry) => ({
        label: entry.label,
        kwhPerHour: entry.kwhPerHour,
        hours: entry.hours,
        gco2eq: entry.result.gco2eq,
        custom: entry.custom,
      })),
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      await fetchOk("/api/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (error) {
      console.error("[impact-simulator] failed to save day", error);
      setSaveError("Impossible d'enregistrer cette journée. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    catalogState,
    customDevices,
    isAdding,
    setIsAdding,
    newLabel,
    setNewLabel,
    newWatts,
    setNewWatts,
    isSaving,
    saveError,
    activeEntries,
    total,
    toggleCatalog,
    setCatalogHours,
    toggleCustom,
    setCustomHours,
    removeCustom,
    handleAddDevice,
    handleSave,
  };
}
