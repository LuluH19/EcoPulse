# EcoPulse — Architecture

Vue d'ensemble de l'architecture : comment les données circulent depuis l'API
RTE jusqu'à l'écran, et où vit chaque responsabilité. Principe directeur :
**aucune logique métier hors des skills et des scripts déterministes.**

---

## 1. Schéma de flux (RTE → écran)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            API RTE Éco2mix (ODRÉ)                            │
│         eco2mix-national-tr · public · JSON · rafraîchi /15 min              │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ HTTP GET (date_heure, taux_co2)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SKILL TRANSVERSE — src/skills/shared/apiFetcher.ts                          │
│  fetchValidated() : timeout · cache TTL 15 min · validation Zod · fallback   │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ RteResponse (validé)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SCRIPT DÉTERMINISTE — scripts/deterministic/parseRteData.ts                 │
│  fenêtre 24 h · rejet null/0/aberrants · tri croissant → [{ time, co2 }]     │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ RtePoint[]  (ou RTE_FALLBACK si vide)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SKILL MÉTIER — src/skills/business/carbonCalculator.ts                      │
│  classifyGridIntensity() · computeCarbonFootprint() · computeUsageFootprint()│
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ CarbonLive (validé par carbonLiveSchema)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  ROUTE API — src/app/api/carbon/live/route.ts                               │
│  orchestre le pipeline · 0 logique inline · renvoie 200 JSON                 │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ fetch('/api/carbon/live')
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  FRONT — src/app/page.tsx + src/components/*                                 │
│  ┌─────────────┐  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │ KPI Live    │  │ Graphique 24 h        │  │ Simulateur d'actions       │  │
│  │ (badge co2) │  │ (Recharts)            │  │ (form + LocalStorage)      │  │
│  └─────────────┘  └──────────────────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────--┘
                                 │ persistance
                                 ▼
                      LocalStorage (simulations)
```

---

## 2. Couches & responsabilités

| Couche                | Fichier(s)                                   | Responsabilité unique                                  | Ne fait JAMAIS                          |
|-----------------------|----------------------------------------------|--------------------------------------------------------|-----------------------------------------|
| Accès données         | `src/skills/shared/apiFetcher.ts`            | Réseau robuste : fetch, timeout, cache, Zod, fallback  | Calcul métier, parsing spécifique RTE   |
| Contrats              | `src/lib/rteSchema.ts`                        | Schémas Zod entrée (RTE) + sortie (`CarbonLive`)       | Logique, I/O                            |
| Nettoyage             | `scripts/deterministic/parseRteData.ts`      | Transformer le flux brut en série propre 24 h          | Appel réseau, classification            |
| Métier                | `src/skills/business/carbonCalculator.ts`    | Formules CO₂, catalogue d'usages, classification       | I/O, parsing, accès réseau              |
| Orchestration         | `src/app/api/carbon/live/route.ts`           | Câbler les couches dans l'ordre, gérer le fallback     | Réimplémenter une formule ou un parsing |
| Présentation          | `src/app/page.tsx`, `src/components/*`       | Affichage, interactions, persistance LocalStorage      | Tout calcul métier (CO₂, moyenne, etc.) |

---

## 3. Arborescence cible

```
ecopulse/
├── CLAUDE.md                      # règles pour l'IA (version courte)
├── PROJECT_RULES.md               # règles métier détaillées (source de vérité)
├── ARCHITECTURE.md                # ce document
├── README.md                      # présentation utilisateur
├── src/
│   ├── app/
│   │   ├── api/carbon/live/route.ts   # endpoint live (orchestrateur)
│   │   └── page.tsx                   # dashboard unique
│   ├── components/                    # KPI, chart, simulateur (UI pure)
│   ├── config/                        # valeurs business centralisées (J3)
│   ├── lib/
│   │   └── rteSchema.ts               # contrats Zod
│   └── skills/
│       ├── business/carbonCalculator.ts   # SKILL MÉTIER
│       └── shared/apiFetcher.ts           # SKILL TRANSVERSE (réutilisable)
└── scripts/
    └── deterministic/
        ├── parseRteData.ts                # SCRIPT DÉTERMINISTE
        └── __tests__/parseRteData.test.ts # tests Vitest
```

---

## 4. Dépendances entre modules (sens autorisé)

```
route.ts ──→ apiFetcher.ts ──→ rteSchema.ts (zod)
route.ts ──→ parseRteData.ts
route.ts ──→ carbonCalculator.ts
page.tsx ──→ route.ts (via fetch HTTP, pas d'import direct)
```

Règles de dépendance :
- Le **front n'importe jamais** directement un skill ou un script de calcul : il
  passe par l'API HTTP. Frontière nette back / front.
- Les **skills ne s'importent pas entre eux** : `carbonCalculator` et
  `apiFetcher` sont indépendants (couplage faible, testables isolément).
- `parseRteData` ne dépend de **rien** (pur, zéro import projet) → c'est ce qui
  le rend déterministe et trivial à tester.
- Les **schémas Zod** (`rteSchema`) sont la seule frontière de confiance : tout
  ce qui entre depuis le réseau y passe.

---

## 5. Stratégie de cache & fraîcheur

- **Cache mémoire** (`apiFetcher`) : TTL 15 min, aligné sur le rafraîchissement
  RTE. Évite de saturer le quota (50 000 req/mois).
- **Revalidation Next.js** : `export const revalidate = 900` sur la route
  (15 min), cohérent avec le cache applicatif.
- Conséquence : au pire, la donnée affichée a 15 min de retard — acceptable pour
  une intensité carbone qui évolue au pas quart d'heure.

---

## 6. Points d'extension prévus

- **OAuth2 RTE** : si bascule vers `data.rte-france.com`, n'impacte que les
  `headers`/`init` passés à `fetchValidated`. Le reste du pipeline est inchangé.
- **DB réelle** (Supabase/Neon) : remplacerait LocalStorage pour les
  simulations ; introduire une couche `src/lib/storage/` sans toucher au métier.
- **Vue régionale** : `eco2mix-regional-tr` suit le même contrat → ajouter un
  paramètre de région au fetcher et un schéma Zod dédié.