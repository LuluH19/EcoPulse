"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarbonBadge } from "@/components/carbon-badge";
import { CarbonChart } from "@/components/carbon-chart";
import { ImpactSimulator } from "@/components/impact-simulator";
import { SavedDays } from "@/components/saved-days";
import type { SavedDay } from "@/lib/storage/storageAdapter";
import type { CarbonLive } from "@/lib/rteSchema";

export default function Home() {
  const [carbonLive, setCarbonLive] = useState<CarbonLive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedDays, setSavedDays] = useState<SavedDay[]>([]);
  const [savedDaysError, setSavedDaysError] = useState<string | null>(null);

  const refreshSavedDays = useCallback(() => {
    fetch("/api/days")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SavedDay[]>;
      })
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

  useEffect(() => {
    let isMounted = true;
    fetch("/api/carbon/live")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<CarbonLive>;
      })
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

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">EcoPulse</h1>

      <Card>
        <CardHeader>
          <CardTitle>Intensité carbone du réseau</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Chargement...</p>}
          {loadError && <p className="text-destructive">Erreur : {loadError}</p>}
          {carbonLive && <CarbonBadge current={carbonLive.current} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 24 h</CardTitle>
        </CardHeader>
        <CardContent>
          {carbonLive && (
            <CarbonChart
              history={carbonLive.history}
              stats={carbonLive.stats}
              source={carbonLive.source}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulateur d&apos;impact</CardTitle>
        </CardHeader>
        <CardContent>
          {carbonLive && (
            <ImpactSimulator
              currentIntensity={carbonLive.current.co2}
              onSaved={refreshSavedDays}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journées enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {savedDaysError && (
            <p className="text-destructive">Erreur : {savedDaysError}</p>
          )}
          <SavedDays days={savedDays} onDeleted={refreshSavedDays} />
        </CardContent>
      </Card>
    </main>
  );
}
