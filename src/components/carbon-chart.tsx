"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CarbonLive } from "@/lib/rteSchema";

interface CarbonChartProps {
  history: CarbonLive["history"];
  stats: CarbonLive["stats"];
  source: CarbonLive["source"];
}

export function CarbonChart({ history, stats, source }: CarbonChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {source === "fallback" && (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Données de secours — l&apos;API RTE est momentanément indisponible.
        </p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>Min : {stats.min} gCO₂eq/kWh</span>
        <span>Max : {stats.max} gCO₂eq/kWh</span>
        <span>Moyenne : {stats.average} gCO₂eq/kWh</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="co2" stroke="#16a34a" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
