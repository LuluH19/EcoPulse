# Skill : errorBoundaryGuide (Protocole d'Erreurs Robuste)

## 🎯 Description
Ce skill standardise la capture, le typage et l'affichage des erreurs. Il garantit
que l'utilisateur voit une fiche de secours informative au lieu d'une page blanche
en cas de panne (API, rendu, stockage).

## 🛠️ Règles d'implémentation

### 1. Typage des erreurs (jamais `any` dans un `catch`)
Hiérarchie unique dans `src/lib/errors.ts` :
- `AppError` (base) — porte un `code` brut et stable (ex: `ERR_NETWORK`).
- `NetworkError extends AppError` — échec réseau / HTTP ; **levée par `fetchOk`**
  (`src/lib/fetchOk.ts`), avec `status` et code `ERR_HTTP_<status>`.
- `ValidationError extends AppError` — donnée hors contrat Zod ; **levée par
  `useCarbonLive`** quand `/api/carbon/live` ne respecte pas `carbonLiveSchema`.
- `ApiFetchError extends AppError` (code `ERR_API_FETCH`) — erreur du fetch réseau
  serveur validé (`src/skills/shared/apiFetcher.ts`).

> Pas de classe d'erreur non levée (Règle « No stub »). On n'ajoute une sous-classe
> que lorsqu'un site de `throw` réel l'utilise.

### 2. Composants de secours (Front)
- **ErrorBoundary local** (`src/components/error-boundary.tsx`) : enveloppe chaque
  bloc majeur (Graphique, Simulateur, Journées) pour isoler une panne de rendu
  sans faire tomber le reste de la page.
- **Route segment** (`src/app/error.tsx`) : filet ultime pour toute erreur non
  interceptée par un boundary local (ex: hook au sommet de la page).

### 3. Interface en cas d'échec (design industriel strict)
- Angles droits (`rounded-none` / pas de rayon), aucune ombre.
- Titre et code en `font-mono uppercase tracking-wider`, texte d'alerte en
  rouge `text-red-500` (`#EF4444`), bordure `border-red-500`.
- Affichage du **code brut** (`AppError.code`, ex: `ERR_HTTP_502`), pas seulement
  un message libre.
- Un bouton unique full-width `bg-slate-900 text-white font-mono uppercase
  tracking-widest rounded-none` : « Réessayer » (boundary) / « Réessayer la
  connexion » (route).

### 4. Résilience métier (rappel CLAUDE.md, Règle 5)
Le flux carbone ne « plante » pas jusqu'au Front : en cas de panne API, la route
sert `CARBON_FALLBACK` en HTTP 200 (`source: 'fallback'`). Les ErrorBoundary
couvrent les erreurs de **rendu** résiduelles, pas le chemin nominal de données.
