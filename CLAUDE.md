# EcoPulse — Notes pour Claude

## Pitch (1 phrase)
Dashboard mono-page pour le grand public soucieux de son empreinte numérique : suivre en temps réel l'intensité carbone du réseau électrique français (RTE Éco2mix) et simuler l'impact CO₂ de ses usages numériques et domestiques pour agir au bon moment.

## Stack technique
- **Langage** : TypeScript (mode `strict`)
- **Framework front** : Next.js 14+ (App Router)
- **Framework back** : Next.js API Routes (App Router, `route.ts`)
- **DB** : LocalStorage (par défaut, projet solo 4 jours) — option Postgres via Supabase/Neon si une vraie couche DB devient nécessaire
- **Auth** : pas d'auth (API RTE publique, pas de données utilisateur sensibles)
- **Styling** : Tailwind CSS + Shadcn/ui
- **Tests** : Vitest

## Règles métier critiques (à NE JAMAIS casser)
1. Tous les calculs d'empreinte carbone se font dans `src/skills/business/carbonCalculator.ts` — JAMAIS inline dans un composant ni dans une route d'API.
2. Le parsing et le nettoyage du flux RTE se font UNIQUEMENT dans `scripts/deterministic/parseRteData.ts`. Une route d'API ne re-parse jamais à la main.
3. Toute donnée externe (réponse RTE) doit être validée par un schéma Zod (`src/lib/rteSchema.ts`) AVANT d'être consommée. Donnée non validée = donnée refusée.
4. Une valeur d'intensité carbone null, à 0 en pleine journée, ou hors de la plage [1, 1200] gCO₂eq/kWh est aberrante et doit être écartée — jamais affichée.
5. En cas de panne de l'API RTE, l'application reste fonctionnelle : elle sert le fallback statique (`RTE_FALLBACK`) en HTTP 200 avec `source: 'fallback'`. Jamais d'écran blanc, jamais de crash.
6. La fenêtre temporelle affichée est strictement les dernières 24 h. Aucun point plus ancien ne remonte jusqu'au front.
7. La classification du réseau (vert / modéré / élevé) provient exclusivement de `classifyGridIntensity` — les seuils ne sont jamais dupliqués ailleurs.

## Conventions de code
- **Nommage fichiers** : kebab-case (`carbon-badge.tsx`)
- **Nommage variables** : camelCase
- **Pas de `any` TypeScript**. Si tu hésites, demande.
- **Pas de `catch` qui avale l'erreur** — toute erreur doit être loggée ou re-throw (le fallback métier est une exception explicite, pas un silence).
- **Un fichier = une responsabilité**. Si un fichier dépasse 250 lignes, on découpe.
- **Toujours typer** les entrées/sorties des fonctions et des routes d'API.

## Scripts déterministes à appeler
Pour les calculs et règles métier, **utilise ces fonctions**, ne les réécris JAMAIS :
- `scripts/deterministic/parseRteData.ts` → nettoie le flux RTE brut et renvoie `[{ time, co2 }]` sur 24 h (filtre null / 0 / aberrants / hors-fenêtre)
- `src/skills/business/carbonCalculator.ts` → empreinte carbone : `gco2eq = energyKwh × intensityGco2PerKwh`, plus `computeUsageFootprint` et `classifyGridIntensity`
- `src/skills/shared/apiFetcher.ts` → fetch réseau robuste : timeout, cache TTL, validation Zod, fallback (skill transverse réutilisable)
- `src/lib/rteSchema.ts` → contrats d'interface Zod (RTE en entrée, `CarbonLive` en sortie) — la source de vérité des formes de données

## Anti-patterns SPÉCIFIQUES au projet
- ❌ Ne JAMAIS appeler le LLM pour faire un calcul d'empreinte carbone ou une moyenne. Utilise les scripts ci-dessus.
- ❌ Ne JAMAIS mettre la logique métier (calcul CO₂, parsing, classification) dans un composant React. Toujours dans `src/skills/` ou `scripts/deterministic/`.
- ❌ Ne JAMAIS hardcoder des valeurs business (seuils vert/modéré/élevé, facteur voiture gCO₂/km, kWh/h des usages, TTL de cache, taille de fenêtre 24 h). Toujours dans `src/config/`.
- ❌ Ne JAMAIS consommer une réponse RTE sans passer par le schéma Zod.

## Anti-patterns d'INGÉNIERIE (les 7 commandements transverses)
1. ❌ **Big bang refacto** : pas de feature flag, pas de coexistence. Remplace, nettoie, commit.
2. ❌ **No stub / no TODO** : pas de `return null; // TODO`. Si commité, ça MARCHE.
3. ❌ **No silent fail** : pas de `try/catch` qui avale. Log ou re-throw.
4. ❌ **No revert** : corrige forward, jamais backward.
5. ❌ **No god file** : >250 lignes = découpe.
6. ❌ **No magic number** : valeurs business → `src/config/`.
7. ❌ **No vibe-prompt** : prompt précis ou pas de prompt.

## Commandes utiles
- `npm run dev` → lance le serveur de dev
- `npm test` → lance les tests unitaires (Vitest)
- `npm run lint` → vérifie le respect des règles
- `npm run build` → build de production (doit passer sans erreur pour "terminé")

## Fichiers de référence
- `PROJECT_RULES.md` → règles métier détaillées (seuils, formules, edge cases du flux RTE)
- `ARCHITECTURE.md` → diagramme de l'archi (composants ↔ skills ↔ scripts ↔ API RTE)
- `README.md` → présentation utilisateur du projet