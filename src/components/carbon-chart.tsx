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
import type { CarbonLive } from "@/lib/carbonSchema";

interface CarbonChartProps {
  history: CarbonLive["history"];
  stats: CarbonLive["stats"];
  source: CarbonLive["source"];
}

export function CarbonChart({ history, stats, source }: CarbonChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {source === "fallback" && (
        <p className="border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-900">
          Données de secours — l&apos;API RTE est momentanément indisponible.
        </p>
      )}

      <div className="flex flex-wrap gap-6 font-mono text-xs uppercase tracking-wider text-slate-500">
        <span>
          Min{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {stats.min}
          </span>
        </span>
        <span>
          Max{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {stats.max}
          </span>
        </span>
        <span>
          Moy{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {stats.average}
          </span>
        </span>
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
