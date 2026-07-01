"use client";

import { useEffect, useState } from "react";
import { fetchOk } from "@/lib/fetchOk";
import { carbonLiveSchema, type CarbonLive } from "@/lib/carbonSchema";
import { ValidationError } from "@/lib/errors";

interface UseCarbonLive {
  carbonLive: CarbonLive | null;
  isLoading: boolean;
  loadError: string | null;
}

/** Charge l'intensité carbone live (24 h) via `/api/carbon/live`. */
export function useCarbonLive(): UseCarbonLive {
  const [carbonLive, setCarbonLive] = useState<CarbonLive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchOk("/api/carbon/live")
      .then((response) => response.json() as Promise<unknown>)
      .then((payload) => {
        const result = carbonLiveSchema.safeParse(payload);
        if (!result.success) {
          throw new ValidationError(
            `Réponse /api/carbon/live invalide : ${result.error.message}`
          );
        }
        if (isMounted) setCarbonLive(result.data);
      })
      .catch((error: Error) => {
        if (isMounted) setLoadError(error.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { carbonLive, isLoading, loadError };
}
