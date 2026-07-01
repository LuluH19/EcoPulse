"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchOk } from "@/lib/fetchOk";
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
      await fetchOk(`/api/days/${id}`, { method: "DELETE" });
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
      <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
        {"// Aucune donnée enregistrée pour l'instant."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {deleteError && (
        <p className="font-mono text-xs text-red-500">{"// "}{deleteError}</p>
      )}
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li
            key={day.id}
            className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 p-3 text-sm"
          >
            <div>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatSavedAt(day.savedAt)} —{" "}
                {toKilograms(day.totalGco2eq).toFixed(2)} kg CO₂eq
              </p>
              <p className="text-xs text-slate-500">
                Intensité à l&apos;enregistrement :{" "}
                <span className="font-mono tabular-nums text-slate-700">
                  {day.intensityAtSave}
                </span>{" "}
                gCO₂eq/kWh · {day.devices.length} appareil(s)
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
