# EcoPulse — Architecture

Vue d'ensemble de l'architecture : comment les données circulent depuis l'API
Electricity Maps jusqu'à l'écran, et où vit chaque responsabilité. Principe
directeur : **aucune logique métier hors des skills et des scripts
déterministes.**

---

## 1. Schéma de flux (Electricity Maps → écran)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       API Electricity Maps (carbon-intensity/history)        │
│              zone=FR · auth-token · JSON · rafraîchi /heure                  │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ HTTP GET (datetime, carbonIntensity)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SKILL TRANSVERSE — src/skills/shared/apiFetcher.ts                          │
│  fetchValidated() : timeout · cache TTL 15 min · validation Zod · fallback   │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ ElectricityMapsHistory (validé)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SCRIPT DÉTERMINISTE — scripts/deterministic/parseCarbonData.ts              │
│  fenêtre 24 h · rejet null/0/aberrants · tri croissant → [{ time, co2 }]     │
└───────────────────────────────┬──────────────────────────────────────────--┘
                                 │ CarbonPoint[]  (ou CARBON_FALLBACK si vide)
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
| Accès données         | `src/skills/shared/apiFetcher.ts`            | Réseau robuste : fetch, timeout, cache, Zod, fallback  | Calcul métier, parsing spécifique Electricity Maps |
| Contrats              | `src/lib/electricityMapsSchema.ts`, `src/lib/carbonSchema.ts` | Schémas Zod entrée (Electricity Maps) + sortie (`CarbonLive`) | Logique, I/O                     |
| Nettoyage             | `scripts/deterministic/parseCarbonData.ts`   | Transformer le flux brut en série propre 24 h          | Appel réseau, classification            |
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
│   │   ├── electricityMapsSchema.ts   # contrat Zod entrée (Electricity Maps)
│   │   └── carbonSchema.ts            # contrat Zod sortie (CarbonLive)
│   └── skills/
│       ├── business/carbonCalculator.ts   # SKILL MÉTIER
│       └── shared/apiFetcher.ts           # SKILL TRANSVERSE (réutilisable)
└── scripts/
    └── deterministic/
        ├── parseCarbonData.ts                # SCRIPT DÉTERMINISTE
        └── __tests__/parseCarbonData.test.ts # tests Vitest
```

---

## 4. Dépendances entre modules (sens autorisé)

```
route.ts ──→ apiFetcher.ts ──→ electricityMapsSchema.ts (zod)
route.ts ──→ parseCarbonData.ts
route.ts ──→ carbonCalculator.ts
page.tsx ──→ route.ts (via fetch HTTP, pas d'import direct)
```

Règles de dépendance :
- Le **front n'importe jamais** directement un skill ou un script de calcul : il
  passe par l'API HTTP. Frontière nette back / front.
- Les **skills ne s'importent pas entre eux** : `carbonCalculator` et
  `apiFetcher` sont indépendants (couplage faible, testables isolément).
- `parseCarbonData` ne dépend de **rien** (pur, zéro import projet) → c'est ce
  qui le rend déterministe et trivial à tester.
- Les **schémas Zod** (`electricityMapsSchema` en entrée, `carbonSchema` en
  sortie) sont la seule frontière de confiance : tout ce qui entre depuis le
  réseau y passe.

---

## 5. Stratégie de cache & fraîcheur

- **Cache mémoire** (`apiFetcher`) : TTL 15 min. Évite de saturer le quota
  (palier gratuit) Electricity Maps.
- **Revalidation Next.js** : `export const revalidate = 900` sur la route
  (15 min), cohérent avec le cache applicatif.
- Conséquence : au pire, la donnée affichée a 15 min de retard — acceptable pour
  une intensité carbone qui évolue au pas quart d'heure.

---

## 6. Couche de stockage (`src/lib/storage/`)

Introduite au J3. Le front et les routes API ne connaissent que l'interface
`StorageAdapter` (`storageAdapter.ts`), jamais l'implémentation concrète.

```
Front (composants)
  → routes API EcoPulse  (positionnent l'anon_id, portent la clé service_role)
    → StorageAdapter (interface)
        └─ SupabaseAdapter   ← seule implémentation au J3
        └─ LocalStorageAdapter  ← extension future, non livrée
                                   (hors-ligne ; même interface)
```

Règles :
- Le front n'appelle JAMAIS Supabase directement : il passe par les routes API,
  qui seules détiennent la clé `service_role` et positionnent l'`anon_id`.
- Ajouter un adaptateur (ex. hors-ligne) = une classe de plus implémentant
  `StorageAdapter` ; aucune route ni composant ne change.
- Pas d'auth : l'appartenance d'une journée est portée par un UUID anonyme en
  cookie (`ecopulse_anon_id`), appliqué par RLS côté Postgres.

## 7. Points d'extension prévus

- **Cache carbone en DB** : porter le cache mémoire de l'`apiFetcher` vers une
  table `carbon_cache` (TTL partagé entre instances). Identifié, non livré J3.
- **LocalStorageAdapter hors-ligne** : seconde implémentation de
  `StorageAdapter`, sans impact sur le reste.
- **Vue régionale** : Electricity Maps expose d'autres zones que `FR` au même
  contrat → paramètre de zone au fetcher, pas de changement de schéma.