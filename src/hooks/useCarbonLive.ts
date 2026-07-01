"use client";

import { useEffect, useState } from "react";
import { fetchOk } from "@/lib/fetchOk";
import type { CarbonLive } from "@/lib/carbonSchema";

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
      .then((response) => response.json() as Promise<CarbonLive>)
      .then((data) => {
        if (isMounted) setCarbonLive(data);
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
