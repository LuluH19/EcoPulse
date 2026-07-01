# Skill Front-End : Refonte Identitaire "EcoPulse" (Industrial Lab)

## 🎯 Objectif du Skill
Ce skill définit les règles de transformation de l'interface actuelle (basée sur la structure de la Capture d’écran 2026-07-01 à 12.12.29.png) vers une identité visuelle singulière, typée "Laboratoire / Fiche Technique". Il élimine les composants génériques "SaaS par défaut" au profit d'un design d'ingénierie rigide, asymétrique et axé sur la donnée brute.

---

## 🎨 Spécifications des Design Tokens (Strict)

### 1. Palette de Couleurs (Light Mode Technique)
- `bg-main`: `#FFFFFF` (Fond de page blanc pur)
- `bg-panel`: `#F8FAFC` (Slate-50 : fond léger pour le simulateur et l'historique)
- `border-grid`: `#E2E8F0` (Slate-200 : l'unique séparateur structurel, épaisseur `1px`)
- `text-main`: `#0F172A` (Slate-900 : haute lisibilité pour la donnée)
- `text-muted`: `#64748B` (Slate-500 : métadonnées, labels, légendes)
- `accent-green`: `#10B981` (Green-500 : signal réseau propre, pas de pastel)
- `accent-warn`: `#EF4444` (Red-500 : signal réseau chargé)

### 2. Typographie & Hiérarchie
- **Chiffres et Data (Données dynamiques) :** `font-mono` (JetBrains Mono / SF Mono). Épaisseur `font-semibold` ou `font-bold`. Alignement tabulaire obligatoire pour éviter le saut de layout lors du rafraîchissement des chiffres.
- **Labels et Titres de Section :** `font-mono text-xs uppercase tracking-wider`.
- **Textes explicatifs :** `font-sans text-sm tracking-tight` (Inter / Geist Sans).

---

## 🗂️ Refonte de l'Architecture Graphique (Layout)

L'empilement vertical à une seule colonne de la Capture d’écran 2026-07-01 à 12.12.29.png est abandonné sur écran large pour optimiser l'espace :

```bash
+------------------------------------------------------------------------------------+
| ECOPULSE // NATIONAL GRID MONITOR                                      [LIVE: 22]  |
+----------------------------------------------------+-------------------------------+
|                                                    | [SIMULATEUR D'IMPACT]         |
|  [INTENSITÉ CARBONE & GRAPHIQUE 24H]               | [ ] Streaming 4K              |
|  - Zone principale de lecture (2/3 de large)       | [ ] Machine à laver           |
|  - Courbe Recharts verte/rouge épurée              |                               |
|  - Lignes de grille horizontales uniquement         | +---------------------------+ |
|                                                    | | SIGNATURE: COMPARATEUR KM | |
|                                                    | +---------------------------+ |
|                                                    +-------------------------------+
|                                                    | [JOURNÉES ENREGISTRÉES]       |
|                                                    | - Liste compacte              |
+----------------------------------------------------+-------------------------------+
| STATUS: NOMINAL // REFRESH: 15M                                                    |
+------------------------------------------------------------------------------------+
```

---

## 📐 Règles d'Implémentation pour Claude Code (Contraintes Techniques)

### 1. Suppression des Décorations Standard
- **ZÉRO** `rounded-lg` ou `rounded-xl`. Toutes les bordures doivent utiliser `rounded-none` (angles droits stricts) pour renforcer l'aspect terminal de laboratoire.
- **ZÉRO** `shadow-sm`, `shadow-md` ou ombres portées. La structure et la profondeur sont portées uniquement par les bordures `border-slate-200`.

### 2. Contrat du Graphique (Recharts)
- Supprimer les bordures de la boîte de tooltip par défaut. Remplacer par un carré brut `bg-slate-900 text-white font-mono text-xs p-2`.
- Désactiver les animations au survol si elles provoquent un lag ou font trop "AI-generated".

### 3. La Signature Visuelle : L'Indicateur Équivalent Voiture
- La boîte grise d'affichage d'équivalence en voiture doit être remplacée par un composant interactif. 
- Utiliser une barre horizontale segmentée (`flex gap-0.5 h-2 bg-slate-100`). Chaque tranche de 0.5 km simulée allume un segment en `bg-slate-900`.

### 4. Robustesse des Libellés et États Vides
- **Empty State (Journées enregistrées) :** Ne pas centrer le texte ou ajouter une icône triste. Écrire simplement : `// AUCUNE DONNÉE ENREGISTRÉE POUR L'INSTANT.` en `text-slate-400 font-mono text-xs`.
- **Boutons d'action :** Remplacer le bouton gris arrondi par un bouton `w-full bg-slate-900 text-white font-mono text-xs uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-colors`.

---

## 🛡️ Validation du Rendu (Anti-Regression Checklist)
Avant de valider une modification, exécuter et vérifier :
1. Les marges de la grille ne s'annulent pas (`paddings` cohérents entre la colonne principale et la colonne latérale).
2. L'affichage est responsive (`grid-cols-1 lg:grid-cols-3`). On repasse sur une seule colonne proprement empilée sur mobile.
3. Aucun commentaire `<!-- TODO -->` ou classe Tailwind inutilisée n'est injecté par l'IA.