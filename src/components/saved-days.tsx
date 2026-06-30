"use client";

import { Button } from "@/components/ui/button";
import { toKilograms } from "@/skills/business/carbonCalculator";
import type { SavedDay } from "@/lib/storage";

interface SavedDaysProps {
  days: SavedDay[];
  onDelete: (id: string) => void;
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SavedDays({ days, onDelete }: SavedDaysProps) {
  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune journée enregistrée pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {days.map((day) => (
        <li
          key={day.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
        >
          <div>
            <p className="font-medium">
              {formatSavedAt(day.savedAt)} — {toKilograms(day.totalGco2eq).toFixed(2)} kg
              CO₂eq
            </p>
            <p className="text-muted-foreground">
              Intensité au moment de l&apos;enregistrement : {day.intensityAtSave}{" "}
              gCO₂eq/kWh · {day.devices.length} appareil(s)
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onDelete(day.id)}>
            Supprimer
          </Button>
        </li>
      ))}
    </ul>
  );
}
