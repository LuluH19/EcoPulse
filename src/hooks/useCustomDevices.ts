"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  computeCarbonFootprint,
  wattsToKwhPerHour,
  type CarbonResult,
} from "@/skills/business/carbonCalculator";
import { DURATION_SLIDER_BOUNDS } from "@/config/duration-slider";

export interface CustomDevice {
  id: string;
  label: string;
  watts: number;
  hours: number;
  active: boolean;
}

export interface ActiveEntry {
  label: string;
  kwhPerHour: number;
  hours: number;
  result: CarbonResult;
  custom: boolean;
}

interface UseCustomDevices {
  customDevices: CustomDevice[];
  customEntries: ActiveEntry[];
  isAdding: boolean;
  setIsAdding: Dispatch<SetStateAction<boolean>>;
  newLabel: string;
  setNewLabel: Dispatch<SetStateAction<string>>;
  newWatts: string;
  setNewWatts: Dispatch<SetStateAction<string>>;
  toggleCustom: (id: string, active: boolean) => void;
  setCustomHours: (id: string, hours: number) => void;
  removeCustom: (id: string) => void;
  handleAddDevice: () => void;
}

/**
 * Gestion des appareils personnalisés du simulateur : état du formulaire
 * d'ajout, mutations de la liste et empreintes dérivées (via `carbonCalculator`).
 */
export function useCustomDevices(currentIntensity: number): UseCustomDevices {
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newWatts, setNewWatts] = useState("");

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

  return {
    customDevices,
    customEntries,
    isAdding,
    setIsAdding,
    newLabel,
    setNewLabel,
    newWatts,
    setNewWatts,
    toggleCustom,
    setCustomHours,
    removeCustom,
    handleAddDevice,
  };
}
