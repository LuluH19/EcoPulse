# Skill : errorBoundaryGuide (Protocole d'Erreurs Robuste)

## 🎯 Description
Ce skill standardise la capture, le typage et l'affichage des erreurs à travers l'application. Il garantit que l'utilisateur fait face à un écran de secours informatif au lieu d'une page blanche en cas de panne de l'API ou du LocalStorage.

## 🛠️ Règles d'implémentation
- **Typage des erreurs :** Interdiction d'utiliser le type générique `any` dans les blocs `catch`. Créer et étendre une classe d'erreur de base `AppError` (ex: `NetworkError`, `StorageError`).
- **Composant de secours (Front) :** Chaque composant majeur (Graphique, Simulateur) doit être enveloppé dans un composant `ErrorBoundary` React.
- **Interface Utilisateur en cas d'échec :** Suivre le style industriel strict du projet : fond sombre ou blanc technique, texte en rouge cuivre (`#EF4444`), affichage du code d'erreur brut (ex: `ERR_RTE_TIMEOUT`), et un bouton unique "Réessayer la connexion" (`rounded-none`).