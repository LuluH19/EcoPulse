# Skill : cacheManager (Éco-Conception & Quotas API)

## 🎯 Description
Ce skill gère la persistance temporaire des données de l'API RTE. L'API étant gratuite et limitée en requêtes, ce skill évite de surcharger le réseau en mettant en cache les résultats côté serveur ou dans le LocalStorage.

## 🛠️ Règles d'implémentation
- **Vérification de fraîcheur :** Avant chaque appel API vers RTE `éco2mix`, vérifier la présence d'une clé de cache (`ecopulse_live_data`) et son timestamp.
- **Règle des 15 minutes :** Si le timestamp du cache a moins de 15 minutes, l'application doit impérativement utiliser la donnée locale stockée et interdire l'appel réseau HTTP.
- **Format du cache :** Stocker la donnée sous la forme :
  ```json
  {
    "timestamp": 1785500000000,
    "intensity": 22,
    "history": [...]
  }