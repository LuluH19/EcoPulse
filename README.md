# EcoPulse

EcoPulse est un dashboard single-page conçu pour aider les utilisateurs à mieux comprendre l'impact carbone de leur consommation d'électricité et de leurs usages numériques.

L'application affiche l'intensité carbone du réseau électrique français en temps réel, propose un historique sur 24 heures, et permet de simuler l'empreinte associée à différents usages (streaming, machine à laver, etc.).

## Fonctionnalités

- Affichage de l'intensité carbone actuelle du réseau français
- Visualisation de l'évolution sur 24 heures
- Simulateur d'impact carbone selon différents usages
- Sauvegarde des journées simulées (Supabase, identifiant anonyme par cookie)
- Gestion d'un fallback si l'API Electricity Maps est indisponible
- Validation des données externes via des schémas Zod
- Interface simple et responsive pour consulter rapidement l'empreinte carbone

## Stack technique

- Next.js 16
- React 19
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Recharts
- Vitest
- Zod

## Démarrage rapide

### Prérequis

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Lancer l'application en local

```bash
npm run dev
```

Puis ouvrir : http://localhost:3000

## Scripts disponibles

```bash
npm run dev      # démarre le serveur de développement
npm run build    # construit l'application pour la production
npm run start    # lance la version buildée
npm run lint     # vérifie le code avec ESLint
npm run test     # exécute les tests Vitest
```

## Structure du projet

```bash
src/
  app/              # pages et routes API Next.js
  components/       # composants UI réutilisables
  config/           # constantes métier et configuration
  lib/              # schémas, stockage local, utilitaires
  skills/           # logique métier et services
scripts/
  deterministic/    # scripts de parsing et traitement des données carbone
```

## Données et sources

L'application récupère les données via l'API Electricity Maps et valide les réponses avec des schémas Zod avant exploitation.

## Notes importantes

- Les règles métier et calculs carbone sont centralisés dans les services du dossier `src/skills/` et les scripts déterministes.
- Les journées simulées sont stockées dans Supabase, identifiées par un UUID anonyme en cookie (`ecopulse_anon_id`) — pas d'auth, pas de compte.
