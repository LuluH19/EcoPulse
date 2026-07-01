"use client";

import type { ReactNode } from "react";
import { CarbonBadge } from "@/components/carbon-badge";
import { CarbonChart } from "@/components/carbon-chart";
import { ImpactSimulator } from "@/components/impact-simulator";
import { SavedDays } from "@/components/saved-days";
import { useCarbonLive } from "@/hooks/useCarbonLive";
import { useSavedDays } from "@/hooks/useSavedDays";

interface PanelProps {
  title: string;
  muted?: boolean;
  children: ReactNode;
}

function Panel({ title, muted = false, children }: PanelProps) {
  return (
    <section
      className={`flex flex-col border border-slate-200 ${
        muted ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-slate-500">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function Home() {
  const { carbonLive, isLoading, loadError } = useCarbonLive();
  const { savedDays, savedDaysError, refreshSavedDays } = useSavedDays();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 bg-white p-4 sm:p-6">
      <header className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3">
        <h1 className="font-mono text-xs uppercase tracking-wider text-slate-900">
          EcoPulse{" "}
          <span className="text-slate-400">{"// National Grid Monitor"}</span>
        </h1>
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          [LIVE:{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {carbonLive ? carbonLive.current.co2 : "--"}
          </span>
          ]
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Intensité carbone du réseau">
            {isLoading && (
              <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
                {"// Chargement..."}
              </p>
            )}
            {loadError && (
              <p className="font-mono text-xs text-red-500">
                {"// Erreur : "}
                {loadError}
              </p>
            )}
            {carbonLive && <CarbonBadge current={carbonLive.current} />}
          </Panel>

          <Panel title="Évolution sur 24 h">
            {carbonLive && (
              <CarbonChart
                history={carbonLive.history}
                stats={carbonLive.stats}
                source={carbonLive.source}
              />
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Simulateur d'impact" muted>
            {carbonLive && (
              <ImpactSimulator
                currentIntensity={carbonLive.current.co2}
                onSaved={refreshSavedDays}
              />
            )}
          </Panel>

          <Panel title="Journées enregistrées" muted>
            {savedDaysError && (
              <p className="font-mono text-xs text-red-500">
                {"// Erreur : "}
                {savedDaysError}
              </p>
            )}
            <SavedDays days={savedDays} onDeleted={refreshSavedDays} />
          </Panel>
        </div>
      </div>

      <footer className="flex items-center justify-between border border-slate-200 bg-white px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Status: Nominal
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Refresh: 15M
        </span>
      </footer>
    </main>
  );
}
