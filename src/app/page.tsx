"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateEmissions, toKilograms } from "@/lib/carbonCalculator";
import type { CarbonIntensityPoint } from "@/lib/types";

const HISTORY_KEY = "ecopulse:simulation-history";
const MAX_HISTORY_ENTRIES = 10;

interface SimulationEntry {
  id: string;
  kWh: number;
  gCO2PerKWh: number;
  emissionsGrams: number;
}

function loadHistory(): SimulationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SimulationEntry[]) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [points, setPoints] = useState<CarbonIntensityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kWhInput, setKWhInput] = useState("1");
  const [history, setHistory] = useState<SimulationEntry[]>(loadHistory);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/carbon-intensity")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<CarbonIntensityPoint[]>;
      })
      .then((data) => {
        if (isMounted) setPoints(data);
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

  const latest = points.at(-1);

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        gCO2PerKWh: point.gCO2PerKWh,
      })),
    [points]
  );

  function handleSimulate() {
    const kWh = Number(kWhInput);
    if (!latest || !Number.isFinite(kWh) || kWh < 0) return;

    const entry: SimulationEntry = {
      id: crypto.randomUUID(),
      kWh,
      gCO2PerKWh: latest.gCO2PerKWh,
      emissionsGrams: calculateEmissions(kWh, latest.gCO2PerKWh),
    };

    const next = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
    setHistory(next);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">EcoPulse</h1>

      <Card>
        <CardHeader>
          <CardTitle>Intensité carbone du réseau (gCO2eq/kWh)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Chargement...</p>}
          {loadError && <p className="text-destructive">Erreur : {loadError}</p>}
          {!isLoading && !loadError && (
            <>
              <p className="mb-4 text-3xl font-semibold">
                {latest ? `${latest.gCO2PerKWh} gCO2eq/kWh` : "—"}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="gCO2PerKWh"
                      stroke="#16a34a"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulateur d&apos;impact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={kWhInput}
              onChange={(event) => setKWhInput(event.target.value)}
              className="w-32 rounded border px-2 py-1"
            />
            <span>kWh</span>
            <Button onClick={handleSimulate} disabled={!latest}>
              Calculer l&apos;impact
            </Button>
          </div>

          {history.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {history.map((entry) => (
                <li key={entry.id}>
                  {entry.kWh} kWh × {entry.gCO2PerKWh} gCO2eq/kWh ={" "}
                  {toKilograms(entry.emissionsGrams).toFixed(2)} kg CO2eq
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
