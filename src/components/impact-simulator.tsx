"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceRow } from "@/components/device-row";
import {
  computeCarbonFootprint,
  computeUsageFootprint,
  sumFootprints,
  wattsToKwhPerHour,
  type CarbonResult,
} from "@/skills/business/carbonCalculator";
import { USAGE_PROFILES, type UsageKey } from "@/config/usage-profiles";
import { DURATION_SLIDER_BOUNDS } from "@/config/duration-slider";
import type { SavedDay } from "@/lib/storage";

const CATALOG_KEYS = Object.keys(USAGE_PROFILES) as UsageKey[];

interface CatalogState {
  active: boolean;
  hours: number;
}

interface CustomDevice {
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

interface ImpactSimulatorProps {
  currentIntensity: number;
  onSave: (day: SavedDay) => void;
}

export function ImpactSimulator({
  currentIntensity,
  onSave,
}: ImpactSimulatorProps) {
  const [catalogState, setCatalogState] = useState<
    Record<UsageKey, CatalogState>
  >(
    () =>
      Object.fromEntries(
        CATALOG_KEYS.map((key) => [key, { active: false, hours: 1 }])
      ) as Record<UsageKey, CatalogState>
  );
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newWatts, setNewWatts] = useState("");

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

  function handleSave(): void {
    if (activeEntries.length === 0) return;
    const day: SavedDay = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
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
    onSave(day);
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {CATALOG_KEYS.map((key) => (
          <DeviceRow
            key={key}
            label={USAGE_PROFILES[key].label}
            active={catalogState[key].active}
            hours={catalogState[key].hours}
            onToggle={(active) => toggleCatalog(key, active)}
            onHoursChange={(hours) => setCatalogHours(key, hours)}
          />
        ))}

        {customDevices.map((device) => (
          <DeviceRow
            key={device.id}
            label={`${device.label} (${device.watts} W)`}
            active={device.active}
            hours={device.hours}
            onToggle={(active) => toggleCustom(device.id, active)}
            onHoursChange={(hours) => setCustomHours(device.id, hours)}
            onRemove={() => removeCustom(device.id)}
          />
        ))}
      </ul>

      {isAdding ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Nom de l'appareil"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            className="w-40"
          />
          <Input
            type="number"
            min="0"
            placeholder="Watts"
            value={newWatts}
            onChange={(event) => setNewWatts(event.target.value)}
            className="w-24"
          />
          <Button onClick={handleAddDevice}>Ajouter</Button>
          <Button variant="ghost" onClick={() => setIsAdding(false)}>
            Annuler
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          Ajouter mon appareil
        </Button>
      )}

      <div className="rounded-md border p-3 text-sm">
        <p className="font-medium">
          Empreinte totale : {Math.round(total.gco2eq)} gCO₂eq (
          {total.kgco2eq.toFixed(2)} kg) — équivalent{" "}
          {total.carKmEquiv.toFixed(1)} km en voiture
        </p>
      </div>

      <Button onClick={handleSave} disabled={activeEntries.length === 0}>
        Enregistrer
      </Button>
    </div>
  );
}
