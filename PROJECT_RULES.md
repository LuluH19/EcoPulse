# EcoPulse — Règles métier détaillées

Ce document est la source de vérité des règles métier. Le `CLAUDE.md` en donne
la version courte ; ici se trouvent les formules exactes, les seuils, la machine
d'état des données et les cas limites. En cas de divergence entre le code et ce
document, c'est un bug : aligner le code sur ce document (ou amender ce document
en connaissance de cause).

---

## 1. Domaine & vocabulaire

- **Intensité carbone** : émissions de CO₂ générées par la production
  d'électricité, exprimées en **gCO₂eq/kWh**. Champ source Electricity Maps :
  `carbonIntensity`.
- **Empreinte d'un usage** : CO₂ émis par une consommation électrique donnée à
  un instant T, en gCO₂eq.
- **Réseau "vert / modéré / élevé"** : classification qualitative de l'intensité
  carbone instantanée, destinée à dire à l'utilisateur si c'est le bon moment
  pour lancer un appareil gourmand.
- **Fenêtre live** : les dernières **24 heures** glissantes.

---

## 2. Source de données : Electricity Maps

- Endpoint : `GET https://api.electricitymap.org/v3/carbon-intensity/history?zone=FR`
- Authentification : header `auth-token: <ELECTRICITY_MAPS_API_KEY>` (clé
  serveur uniquement, jamais exposée au client — voir `.env.example`).
- Rafraîchissement source : horaire.
- Réponse : `history[]` avec jusqu'à 24 points (un par heure glissante).
- Quota : palier gratuit limité → le cache (TTL 15 min) est **obligatoire**,
  pas optionnel.
- Champs consommés (et eux seuls) : `datetime` (ISO 8601, UTC),
  `carbonIntensity` (nombre, g/kWh).
- Si `ELECTRICITY_MAPS_API_KEY` n'est pas configurée, la source live est
  désactivée et l'app sert directement `CARBON_FALLBACK` (HTTP 200,
  `source: 'fallback'`) — jamais d'erreur ni d'écran blanc.

---

## 3. Formules (source de vérité)

Toutes implémentées dans `src/skills/business/carbonCalculator.ts`. Ne jamais
les réécrire ailleurs.

### 3.1 Empreinte d'une consommation
```
gco2eq      = energyKwh × intensityGco2PerKwh
kgco2eq     = gco2eq / 1000
carKmEquiv  = gco2eq / CAR_GCO2_PER_KM
```
- `CAR_GCO2_PER_KM = 120` (voiture thermique moyenne FR, gCO₂eq/km).

### 3.2 Empreinte d'un usage catalogué
```
energyKwh = USAGE_PROFILES[usage].kwhPerHour × hours
puis 3.1
```

### 3.3 Catalogue d'usages (`USAGE_PROFILES`)
| clé              | label              | kWh/h |
|------------------|--------------------|-------|
| `streaming4k`    | Streaming 4K       | 0.22  |
| `streamingHd`    | Streaming HD       | 0.077 |
| `washingMachine` | Machine à laver    | 1.0   |
| `gamingPc`       | PC gaming          | 0.4   |
| `videoCall`      | Visioconférence    | 0.15  |

### 3.4 Classification du réseau (`classifyGridIntensity`)
| intensité (gCO₂eq/kWh) | classe    |
|------------------------|-----------|
| ≤ 60                   | `vert`    |
| 61 – 150               | `modere`  |
| > 150                  | `eleve`   |

---

## 4. Nettoyage du flux carbone (`scripts/deterministic/parseCarbonData.ts`)

Composant le plus critique : déterministe, pur, testé en isolation. Entrée =
échantillons bruts Electricity Maps ; sortie = `[{ time: "HH:mm", co2: number }]`
trié croissant.

### 4.1 Extraction
- Horodatage : `datetime` (ISO 8601, UTC).
- Valeur CO₂ : `carbonIntensity` (nombre).
- Tout point dont l'un des deux champs est absent ou du mauvais type est
  écarté (pas de conversion tolérante de chaîne : Electricity Maps renvoie du
  JSON typé, contrairement à l'ancien flux RTE/ODRÉ).

### 4.2 Règles de rejet (un point écarté n'est JAMAIS affiché)
Un point est rejeté si :
1. horodatage absent ou non parsable ;
2. valeur CO₂ absente, non numérique, ou `null` ;
3. valeur hors plage de plausibilité **[1, 1200]** gCO₂eq/kWh
   (couvre le `0` aberrant en pleine journée et les pics impossibles) ;
4. horodatage hors fenêtre : antérieur à `now − 24 h` ou postérieur à `now`.

### 4.3 Sortie
- Tri **croissant** par horodatage.
- `co2` arrondi à l'entier.
- Entrée non-tableau → `[]` (robustesse runtime, pas d'exception).

---

## 5. Contrat de l'API interne `/api/carbon/live`

### 5.1 Pipeline (ordre imposé, aucune logique inline)
```
apiFetcher.fetchValidated   (fetch + Zod + cache + timeout)
  → parseCarbonData         (nettoyage déterministe 24 h)
    → classifyGridIntensity (classification métier)
```

### 5.2 Réponse (`CarbonLive`, validée par `carbonLiveSchema`)
```jsonc
{
  "current":  { "co2": 44, "time": "13:45", "classification": "vert" },
  "history":  [ { "time": "13:00", "co2": 52 }, ... ],
  "source":   "live"        // ou "fallback"
}
```
- `current` = dernier point de `history`.
- HTTP **200** dans tous les cas nominaux.

---

## 6. Dégradation & fallback (règle de robustesse)

L'application ne tombe jamais en panne visible.

| Situation                                          | Comportement      | `source`   | HTTP |
|-----------------------------------------------------|--------------------|------------|------|
| Clé absente                                          | `CARBON_FALLBACK`  | `fallback` | 200  |
| API Electricity Maps OK, données exploitables        | données live       | `live`     | 200  |
| API Electricity Maps OK mais 0 point valide après nettoyage | `CARBON_FALLBACK` | `fallback` | 200  |
| API Electricity Maps en panne / timeout / payload invalide | `CARBON_FALLBACK` | `fallback` | 200  |

- `CARBON_FALLBACK` est une courbe statique **propre et plausible** (6 points type).
- Le front DOIT signaler visuellement le mode `fallback` (badge "données de
  secours") — ne jamais faire passer du fallback pour du live.

---

## 7. Persistance des simulations (front + DB, J3)

- Stockage : **Supabase (Postgres managé)**, pas de LocalStorage pour les
  données livrées. L'accès se fait derrière une interface `StorageAdapter`
  (voir ARCHITECTURE.md §6) : une seule implémentation au J3,
  `SupabaseAdapter`. L'interface existe pour prouver le découplage et permettre
  d'ajouter un `LocalStorageAdapter` hors-ligne plus tard sans toucher au reste.
- **Pas d'auth, pas de compte, pas de login.** Pour retrouver ses journées,
  l'utilisateur est identifié par un **identifiant anonyme** : un UUID v4
  généré côté client au premier passage et conservé dans un cookie
  (`ecopulse_anon_id`, durée 1 an, SameSite=Lax). Cet UUID est la clé
  d'appartenance des journées en DB. Il ne contient aucune donnée personnelle
  et n'est relié à aucune identité.
- Une journée enregistrée conserve le détail des appareils. Forme applicative :
  ```ts
  interface SavedDay {
    id: string;           // uuid (généré DB)
    anonId: string;       // identifiant anonyme propriétaire
    savedAt: string;      // ISO
    intensityAtSave: number;  // gCO2eq/kWh figée à l'enregistrement
    totalGco2eq: number;      // somme des empreintes des appareils
    devices: Array<{
      label: string;      // "Streaming 4K" ou nom personnalisé
      kwhPerHour: number; // profil prédéfini OU watts/1000 pour un custom
      hours: number;
      gco2eq: number;     // empreinte de cet appareil seul
      custom: boolean;
    }>;
  }
  ```
- Le détail des appareils est conservé pour qu'une journée puisse être
  **rouverte et modifiée** (ré-ajouter un appareil, changer une durée).
- L'intensité est figée **au moment de l'enregistrement** (`intensityAtSave`) :
  on ne recalcule jamais une journée passée avec l'intensité du jour.
- Appareil personnalisé : saisi en **watts** (étiquette de l'appareil),
  converti en kWh/h via `watts / 1000`. Conversion = logique métier → vit dans
  `carbonCalculator.ts`, jamais dans le composant.
- `totalGco2eq` = somme des `gco2eq` des appareils actifs, via le helper du
  skill métier, pas inline dans le front.

### Sécurité Supabase (CRITIQUE — à ne jamais casser)
- La clé `service_role` ne quitte JAMAIS le serveur (routes API uniquement).
  Elle ne doit jamais figurer dans un composant client ni dans le bundle.
- Le front utilise au plus la clé `anon` (publique) ; tout accès aux journées
  passe par les routes API d'EcoPulse, jamais par un appel Supabase direct
  depuis le navigateur.
- Row Level Security (RLS) activée sur la table : une ligne n'est lisible que
  pour son `anon_id`. La clé est passée par le serveur, jamais par le client.

### Cache carbone — hors périmètre J3 (évolution prévue)
- Le cache de l'`apiFetcher` reste **en mémoire** pour le J3 (suffisant pour la
  démo). Le porter en DB (table `carbon_cache` avec `expires_at` partagé entre
  instances) est une évolution identifiée mais NON livrée au J3.

---

## 8. Edge cases recensés

- **Nuit / heures creuses** : intensité souvent < 50 g → classe `vert`, normal.
- **Pointe gaz** : intensité qui grimpe > 150 g → classe `eleve`, normal.
- **Trou de données Electricity Maps** (maintenance) : points absents ou
  `carbonIntensity` non numérique sur plusieurs pas → points rejetés ; si tout
  le lot est rejeté → fallback.
- **Décalage horaire** : `datetime` Electricity Maps est en UTC (ISO 8601) ;
  l'affichage `HH:mm` suit le fuseau du runtime. À surveiller si déploiement
  multi-région.
- **Durée de simulation = 0 h** : empreinte = 0, autorisé (pas une erreur).
- **Valeurs négatives** (energyKwh, hours, intensité) : **exception levée**,
  jamais de calcul silencieux sur entrée invalide.