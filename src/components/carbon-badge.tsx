import { Badge } from "@/components/ui/badge";
import type { CarbonLive, GridClassification } from "@/lib/carbonSchema";

interface ClassificationMeta {
  label: string;
  badgeClassName: string;
  action: string;
}

const CLASSIFICATION_META: Record<GridClassification, ClassificationMeta> = {
  vert: {
    label: "Réseau vert",
    badgeClassName: "bg-green-600 text-white",
    action: "C'est le bon moment pour lancer vos appareils gourmands.",
  },
  modere: {
    label: "Réseau modéré",
    badgeClassName: "bg-amber-500 text-white",
    action: "Usage normal : ni le meilleur, ni le pire moment.",
  },
  eleve: {
    label: "Réseau élevé",
    badgeClassName: "bg-red-600 text-white",
    action: "Mieux vaut attendre pour lancer vos appareils gourmands.",
  },
};

interface CarbonBadgeProps {
  current: CarbonLive["current"];
}

export function CarbonBadge({ current }: CarbonBadgeProps) {
  const meta = CLASSIFICATION_META[current.classification];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-5xl font-bold tabular-nums text-slate-900">
          {current.co2}
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          gCO₂eq/kWh
        </span>
        <Badge className={meta.badgeClassName}>{meta.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Mesuré à {current.time} — {meta.action}
      </p>
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer select-none font-medium text-foreground">
          Qu&apos;est-ce que le gCO₂eq/kWh ?
        </summary>
        <p className="mt-2">
          C&apos;est la quantité de CO₂ équivalent émise pour produire 1 kWh
          d&apos;électricité. Repère : en France, le réseau tourne en général
          entre 30 et 80 gCO₂eq/kWh (grâce au nucléaire) ; en Allemagne, entre
          300 et 500 gCO₂eq/kWh (mix plus carboné).
        </p>
      </details>
    </div>
  );
}
