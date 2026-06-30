"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toKilograms } from "@/skills/business/carbonCalculator";
import type { SavedDay } from "@/lib/storage/storageAdapter";

interface SavedDaysProps {
  days: SavedDay[];
  onDeleted: () => void;
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SavedDays({ days, onDeleted }: SavedDaysProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/days/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      onDeleted();
    } catch (error) {
      console.error("[saved-days] failed to delete day", error);
      setDeleteError("Impossible de supprimer cette journée. Réessayez.");
    } finally {
      setDeletingId(null);
    }
  }

  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune journée enregistrée pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li
            key={day.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {formatSavedAt(day.savedAt)} —{" "}
                {toKilograms(day.totalGco2eq).toFixed(2)} kg CO₂eq
              </p>
              <p className="text-muted-foreground">
                Intensité au moment de l&apos;enregistrement :{" "}
                {day.intensityAtSave} gCO₂eq/kWh · {day.devices.length}{" "}
                appareil(s)
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={deletingId === day.id}
              onClick={() => handleDelete(day.id)}
            >
              {deletingId === day.id ? "Suppression..." : "Supprimer"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
