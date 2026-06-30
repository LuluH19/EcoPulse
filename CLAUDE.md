Excellent choix de projet. Le Dashboard Éco-Responsable se prête parfaitement à cette méthode rigoureuse. On oublie le "vibe coding" (coder au feeling avec l'IA en espérant que ça marche) et on passe sur une approche d'ingénierie logicielle pilotée par **Claude Code**.

Voici le cadrage complet et pensé pour ton sprint de 4 jours, taillé sur mesure pour la stack Next.js/TS et les contraintes méthodologiques.

---

## 🎯 Le Produit : "EcoPulse"

Un dashboard monocreton (single-page) qui permet à un utilisateur de suivre l'intensité carbone de l'électricité du réseau français en temps réel (via RTE) et de simuler l'impact de ses actions numériques ou domestiques (ex: lancer une machine, regarder un stream).

### La stack technique recommandée

* **Front/Back :** Next.js latest version (App Router, qui gère nativement les API routes pour le back).
* **Langage :** TypeScript (strict).
* **Style :** Tailwind CSS + Shadcn/ui (pour une UI pro générée proprement par Claude Code).
* **Graphiques :** Recharts (très compatible avec React/TS).
* **Persistance :** LocalStorage (suffisant pour un projet solo de 4 jours, gratuit, zéro config) ou une base PostgreSQL gratuite sur **Supabase** ou **Neon** si tu veux une vraie couche DB.

---

## 🏗️ La Structure Méthodologique (Le Cœur de l'Exercice)

Pour que Claude Code soit ton ouvrier ultra-efficace, tu dois lui donner un cadre strict. Voici comment structurer ton projet dès le Jour 1.

### 1. Le fichier `CLAUDE.md` (À la racine du projet)

Ce fichier dicte le comportement de Claude Code. Il doit être concis et lu par l'IA à chaque interaction.

```markdown
# Configuration du Projet EcoPulse

## Règles de Code
- Stack : Next.js (App Router), TypeScript (mode strict), Tailwind CSS, Shadcn/ui.
- Interdiction d'écrire des commentaires de code inutiles ou du "todo".
- Toujours typer les entrées/sorties des fonctions et des routes d'API.
- Gestion d'erreur explicite avec des blocs try/catch et des statuts HTTP clairs.

## Commandes Utiles
- Build : `npm run build`
- Dev : `npm run dev`
- Lint : `npm run lint`
- Test : `npm run test` (si applicable)

## Architecture des Scripts Déterministes
- Tous les calculs d'impact carbone complexes doivent utiliser exclusivement les scripts du dossier `/scripts/deterministic/`.
- L'IA ne doit JAMAIS improviser ou coder une formule mathématique d'impact carbone directement dans un composant React.

```

### 2. Le Skill Métier : "L'Éco-Calculateur Énergétique"

Ce skill abstrait la logique métier complexe. Il s'assure que l'application sait convertir de la donnée brute en information écologique concrète.

* **Rôle :** Prendre une consommation brute en kWh (fournie par l'utilisateur ou une estimation) et l'intensité carbone en temps réel de RTE (gCO2eq/kWh) pour calculer l'empreinte carbone réelle à l'instant T.
* **Fichier cible :** `src/skills/business/carbonCalculator.ts`

### 3. Le Skill Transverse : "Le Fetcher / Sanitizer d'API Robustesse"

Ce skill est réutilisable dans n'importe quel autre projet. Il gère les appels réseau, le caching temporaire pour éviter de saturer les API gratuites, et la sécurité des payloads.

* **Rôle :** Effectuer les requêtes vers l'API RTE Éco2mix, valider que la donnée reçue correspond exactement au contrat d'interface (via un schéma de validation comme Zod), et gérer les cas de panne de l'API (fallback sur des données statiques propres si l'API crash).
* **Fichier cible :** `src/skills/shared/apiFetcher.ts`

### 4. Le Script Déterministe : `parse-rte-data.ts`

Plutôt que de demander à Claude à chaque prompt : *"Prends le JSON de RTE et fais-moi une moyenne"*, tu crées un script Node pur et immuable.

* **Rôle :** Ce script prend le flux de données brutes de RTE (qui est souvent verbeux ou mal formaté), extrait uniquement la courbe des dernières 24h, nettoie les valeurs aberrantes (ex: `null` ou `0` en pleine journée), et recrache un JSON standardisé utilisable par Recharts : `[{ time: "12:00", co2: 45 }, ...]`.
* **Fichier :** `scripts/deterministic/parseRteData.js` (ou `.ts`)

---

## 📅 Le Planning de Cadrage (4 Jours)

1. **Jour 1 : Fondations & Scripts Déterministes:** Focus : Données & Règles.
Initialisation du projet Next.js. Écriture du `CLAUDE.md`. Développement du script déterministe de parsing et test avec un fichier JSON local (mock de RTE). Validation du pipeline de données.


2. **Jour 2 : Couche Back & Skills:** Focus : Logique API & Métier.
Création de la route d'API Next.js (`/api/carbon/live`). Intégration du *Skill Transverse* (fetcher avec gestion des erreurs) et du *Skill Métier* (calculateur). À la fin du J2, ton back fonctionne : une requête sur l'API renvoie de la donnée propre et calculée.


3. **Jour 3 : Front & Persistance:** Focus : UI & State.
Génération des composants graphiques (Recharts) avec Claude Code. Intégration de la persistance (LocalStorage) pour sauvegarder les simulations de l'utilisateur (ex: "Mes actions enregistrées"). L'application devient interactive.


4. **Jour 4 : Polish & Livraison:** Focus : UX & Robustesse.
Chasse aux bugs via Claude Code en utilisant `npm run lint` et `npm run build`. Amélioration de l'UI (états de chargement, gestion du mode hors-ligne). Déploiement en 1 clic sur Vercel.


---

## 🎨 L'Interface Utilisatrice (L'écran unique)

L'application tiendra sur un seul tableau de bord divisé en 3 zones visuelles nettes :

1. **Le KPI "Live" :** Un gros badge lumineux affichant l'indice carbone actuel de la France (ex: `42 gCO2e/kWh - Réseau Vert`).
2. **Le Graphique temporel :** Une belle courbe d'évolution de la journée pour voir si c'est le bon moment pour lancer ses appareils gourmands.
3. **Le Simulateur d'actions :** Un formulaire simple où l'on choisit un usage (ex: "4h de streaming 4K") et qui s'enregistre en base/local pour afficher un historique des économies réalisées.

Tu as maintenant un projet parfaitement cadré, des limites claires pour l'IA, et une architecture qui t'évitera de coder "au talent". Prêt à lancer l'initialisation du projet ?