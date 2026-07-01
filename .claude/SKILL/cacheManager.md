# Skill : cacheManager (Éco-Conception & Quotas API)

## 🎯 Description
Ce skill gère la persistance temporaire des données d'intensité carbone. L'API
Electricity Maps étant limitée en requêtes, on met en cache les résultats pour
éviter de la surcharger.

> ⚠️ **Ce cache existe déjà — ne PAS le réimplémenter.** CLAUDE.md assigne le
> cache carbone à `src/skills/shared/apiFetcher.ts` (« Cache carbone : en
> mémoire »). Créer un `src/utils/cache.ts` dupliquerait cette couche et
> introduirait une seconde source de vérité. Ce skill documente le mécanisme en
> place et la règle des 15 minutes.

## 🛠️ Mécanisme en place (source de vérité unique)
- **Cache mémoire à TTL :** `apiFetcher.fetchValidated(url, schema, { cacheTtlMs })`
  garde un `Map` keyé par URL ; une entrée non expirée est re-validée par Zod puis
  renvoyée sans appel réseau (`src/skills/shared/apiFetcher.ts`).
- **Règle des 15 minutes :** la TTL vient de `ELECTRICITY_MAPS_CACHE_TTL_MS =
  15 * 60 * 1000` (`src/config/electricity-maps.ts`). Tant que l'entrée a moins de
  15 min, aucun appel HTTP n'est émis vers Electricity Maps.
- **Revalidation route :** `export const revalidate = 900` sur
  `src/app/api/carbon/live/route.ts` aligne le cache Next sur la même fenêtre.

## 📌 Règles
- La valeur de 15 min est **une constante de config**, jamais un nombre en dur
  (Règle « No magic number »). Pour changer la fréquence, modifier UNIQUEMENT
  `ELECTRICITY_MAPS_CACHE_TTL_MS` (et `revalidate` en conséquence).
- **Pas de cache LocalStorage côté client.** Le client interroge
  `/api/carbon/live`, déjà servi depuis le cache serveur ; un cache navigateur
  ajouterait une couche divergente et pourrait afficher des points hors de la
  fenêtre stricte des 24 h.
- **Cache = donnée validée.** Une entrée n'est mise en cache qu'après passage par
  le schéma Zod ; à la lecture, elle est re-validée. Donnée non validée = refusée.
