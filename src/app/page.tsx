"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarbonBadge } from "@/components/carbon-badge";
import { CarbonChart } from "@/components/carbon-chart";
import { ImpactSimulator } from "@/components/impact-simulator";
import { SavedDays } from "@/components/saved-days";
import { useCarbonLive } from "@/hooks/useCarbonLive";
import { useSavedDays } from "@/hooks/useSavedDays";

export default function Home() {
  const { carbonLive, isLoading, loadError } = useCarbonLive();
  const { savedDays, savedDaysError, refreshSavedDays } = useSavedDays();

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
