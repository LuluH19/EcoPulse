# Skill : dataSanitizer (Nettoyage & Validation)

## 🎯 Description
Ce skill s'active dès que l'application reçoit des données externes (payloads de
l'API Electricity Maps, entrées du formulaire du simulateur). Son but est de
valider le typage et d'écarter les données aberrantes de manière déterministe
avant qu'elles n'atteignent le Front.

> ⚠️ **Cohérence avec CLAUDE.md (règles qui priment).** Le flux carbone possède
> déjà un pipeline de validation/nettoyage **unique** — ne PAS le dupliquer. Ce
> skill le documente et ne s'implémente à neuf QUE pour les entrées du simulateur.

## 🛠️ Règles d'implémentation

### 1. Schémas stricts (Zod, source de vérité unique)
- **Flux carbone (existant, ne pas recréer) :**
  - Entrée brute Electricity Maps → `src/lib/electricityMapsSchema.ts`
  - Sortie `CarbonLive` → `src/lib/carbonSchema.ts`
- **Entrées simulateur (ce skill) :**
  - Appareil personnalisé → `src/lib/deviceInputSchema.ts`
  - Payload persisté d'une journée → `src/lib/storage/savedDaySchema.ts`

### 2. Nettoyage des données (Sanitization) — ÉCARTER, jamais coercer
- **Intensité carbone :** une valeur `null`, à `0` en pleine journée, ou hors de
  la plage plausible **`[1, 1200]` gCO₂eq/kWh** est **écartée** (retirée du jeu de
  données), **jamais affichée et jamais remplacée par une valeur inventée**
  (CLAUDE.md, Règle 4). Ce filtrage se fait **uniquement** dans
  `scripts/deterministic/parseCarbonData.ts`.
- **Entrées simulateur :** puissance en watts **strictement positive** et sous une
  borne haute anti-aberrant (`src/config/device-input.ts`). Toute valeur `≤ 0`,
  non numérique, ou au-dessus de la borne est **rejetée** (l'appareil n'est pas
  ajouté et un message est affiché).
- **Chaînes utilisateur :** libellé `trim()` + longueur bornée. Aucun échappement
  manuel n'est requis : React échappe automatiquement le texte au rendu (JSX), il
  ne faut donc PAS réintroduire de faux « anti-injection » côté chaîne.

### 3. Seuils & bornes → jamais en dur
Toutes les bornes business vivent dans `src/config/` (Règle « No magic number ») :
plage carbone `grid-thresholds.ts`, fenêtre 24 h, bornes watts `device-input.ts`,
bornes de durée `duration-slider.ts`.

### 4. Zéro crash — résultat standardisé
En cas d'échec de validation d'une entrée simulateur, renvoyer un objet
`{ success: false, data: null, error: "Détail court" }` (helper
`sanitizeDeviceInput`) au lieu de lever une exception. Côté flux carbone, le
principe équivalent est déjà appliqué : sur payload invalide/API en panne, la
route sert `CARBON_FALLBACK` en HTTP 200 (`source: 'fallback'`), jamais d'écran
blanc.
