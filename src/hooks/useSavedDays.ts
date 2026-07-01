"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOk } from "@/lib/fetchOk";
import type { SavedDay } from "@/lib/storage/storageAdapter";

interface UseSavedDays {
  savedDays: SavedDay[];
  savedDaysError: string | null;
  refreshSavedDays: () => void;
}

/** Charge et rafraîchit les journées enregistrées via `/api/days`. */
export function useSavedDays(): UseSavedDays {
  const [savedDays, setSavedDays] = useState<SavedDay[]>([]);
  const [savedDaysError, setSavedDaysError] = useState<string | null>(null);

  const refreshSavedDays = useCallback(() => {
    fetchOk("/api/days")
      .then((response) => response.json() as Promise<SavedDay[]>)
      .then((data) => {
        setSavedDays(data);
        setSavedDaysError(null);
      })
      .catch((error: Error) => {
        setSavedDaysError(error.message);
      });
  }, []);

  useEffect(() => {
    refreshSavedDays();
  }, [refreshSavedDays]);

  return { savedDays, savedDaysError, refreshSavedDays };
}
