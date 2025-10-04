# Contexte du projet WAT (What Anime Today)

## Vision du projet
Créer une application simple, moderne et intuitive qui centralise les sorties d’animes du jour et de la semaine, avec des recommandations personnalisées, un suivi de visionnage et un aspect communautaire.  
L’objectif est d’offrir un outil indispensable pour les fans d’animes afin qu’ils sachent toujours **quoi regarder aujourd’hui** et où le regarder légalement.

## Objectifs principaux
- [x] Fournir un calendrier quotidien et hebdomadaire des sorties d’animes.
- [x] Permettre aux utilisateurs de suivre leur progression (épisodes vus / à voir).
- [x] Intégrer des visuels de qualité (affiches, trailers) pour rendre l’app attractive.
- [ ] Mettre en place des recommandations personnalisées basées sur les préférences.
- [ ] Proposer un aspect social (comparaison avec d’autres fans).

## Public cible
- Fans d’animes francophones et anglophones (ado, jeunes adultes, étudiants, otakus).
- Utilisateurs de plateformes de streaming légales (Crunchyroll, ADN, Netflix…).
- Personnes qui veulent découvrir facilement de nouveaux animes adaptés à leurs goûts.

## Fonctionnalités prioritaires
### Must-have (indispensables)
- [x] Affichage des sorties quotidiennes et hebdomadaires.
- [x] Informations détaillées sur chaque anime (synopsis, genres, notes, visuels).
- [x] Suivi de progression (watchlist : à voir, en cours, terminé).
- [x] Liens vers plateformes légales de streaming.

### Nice-to-have (souhaitables)
- [ ] Système de recommandations personnalisées.
- [ ] Compatibilité multi-langues (FR/EN).
- [ ] Comparaison avec d’autres utilisateurs (taux de compatibilité).
- [ ] Classement des animes populaires de la semaine.

### Future features (pour plus tard)
- [ ] Notifications push (nouvel épisode dispo).
- [ ] Extension Chrome (rappel en un clic).
- [ ] Mode hors ligne (accéder à sa liste même sans connexion).
- [ ] Partage social (tweet “Je regarde ça aujourd’hui sur WAT”).

## Contraintes techniques
- Backend : **Java 17 / Spring Boot 3**.
- Frontend : **React (Vite)**.
- APIs externes : **Kitsu** (visionnage + social), **Jikan** (planning MAL), **TMDB** (posters/trailers).
- Mise en cache obligatoire (Caffeine/Redis) pour limiter les appels aux APIs externes.
- Hébergement cloud (GCP/Azure/GitHub Actions pour CI/CD).

## Plateformes de streaming ciblées
- [x] Crunchyroll
- [x] Netflix
- [x] ADN (Animation Digital Network)
- [x] Prime Video
- [x] Disney+
- [x] Autres : à étudier

## Pays/Régions ciblés
- [x] France
- [x] Europe
- [ ] États-Unis
- [ ] Autres : Asie (optionnel, dépend des droits de diffusion)

## Sources de données
- [x] Jikan API (MyAnimeList) → planning + notes
- [x] Kitsu API → suivi et social
- [x] TMDB → visuels et trailers
- [ ] Autres : éventuellement AniList (tendances)

## Fonctionnalités de notification
- [ ] Application mobile (Android/iOS)
- [ ] Notifications web (push)
- [ ] Email (newsletter “vos sorties de la semaine”)
- [ ] Extension Chrome
- [ ] Autres : Discord bot (idée future)

## Modèle économique envisagé
- [x] Gratuit au lancement (MVP).
- [x] Freemium (version gratuite avec pubs + version premium sans pubs).
- [ ] Abonnement mensuel (2-4€/mois) → recommandations avancées + mode hors ligne.
- [x] Publicité discrète dans la version gratuite.

## Problèmes actuels rencontrés
- Choix et intégration des APIs (limites, doublons, fusion de données).
- Gestion des quotas et besoin de mettre en place un cache robuste.
- Uniformiser les données provenant de plusieurs sources (Kitsu ≠ Jikan ≠ TMDB).
- Définir une UX claire pour que l’app reste simple malgré beaucoup de fonctionnalités.


## Ressources disponibles
- Budget : limité (objectif gratuit au début).
- Équipe : projet solo au démarrage.
- Outils : GitHub, Copilot.

## Inspiration/Concurrence
- MyAnimeList (référence mondiale mais UI vieillotte).
- AniList (GraphQL, propre, bonnes stats).
- Kitsu (social, visionnage, mais communauté plus petite).
- LiveChart.me (calendrier simple mais pas de suivi).
- AnimeTrakr (suivi + notifications, peu ergonomique).

## Notes supplémentaires
- L’application doit rester **rapide, claire et minimaliste** : pas une usine à gaz.
- Objectif : séduire d’abord la communauté FR/étudiante, puis élargir.
- Le design doit être **mobile-first**, même si le MVP est en web app.


## Bonnes pratiques à toujours mettre en place

### 🚀 Performance & Cache
- **Cache obligatoire** : Toujours cacher les réponses API (Jikan, Kitsu, TMDB) pour éviter les rate limits
- **Cache stratifié** : Cache par pays, par jour, par type de données
- **TTL adaptatif** : 24h pour les sorties quotidiennes, 1h pour les détails anime
- **Lazy loading** : Charger les images et données au scroll pour la performance mobile

### 🔄 Gestion des APIs externes
- **Retry logic** : Retry automatique avec backoff exponentiel en cas d'échec API
- **Fallback systems** : Si Jikan échoue → Kitsu, si Kitsu échoue → cache local
- **Rate limiting** : Respecter les limites (Jikan: 3 req/sec, Kitsu: plus flexible)
- **Monitoring** : Logger les échecs d'API pour identifier les patterns

### 🧪 Qualité du code
- **Tests automatisés** : Unit tests sur la logique métier, tests d'intégration API
- **CI/CD pipeline** : Build/test/deploy automatique sur GitHub Actions
- **Code review** : Même en solo, relire le code avant commit
- **Documentation** : README à jour, Swagger pour l'API, JSDoc pour le frontend

### 📱 UX/UI
- **Mobile-first** : Design et test d'abord sur mobile, puis desktop
- **Loading states** : Skeleton screens pendant les chargements
- **Error handling** : Messages d'erreur clairs et actions de récupération
- **Accessibilité** : Contraste, navigation clavier, screen readers

### 🔒 Sécurité & Robustesse
- **Validation stricte** : Valider toutes les entrées utilisateur (XSS, injection)
- **CORS configuré** : Limiter les origines autorisées
- **Rate limiting côté serveur** : Protéger l'API contre l'abus
- **Logs structurés** : Pour débugger rapidement les problèmes en production

### 📊 Monitoring & Analytics
- **Health checks** : Endpoints de santé pour monitorer les services
- **Métriques clés** : Temps de réponse API, taux d'erreur, utilisation cache
- **Analytics simples** : Quelles pages sont les plus visitées, quels animes sont populaires
- **Alerting** : Notifications si le service tombe

### 🔧 DevOps & Déploiement
- **Environment variables** : Ne jamais commit les clés API
- **Docker** : Containerisation pour la reproductibilité
- **Backup automatique** : Sauvegarde des données utilisateur et cache
- **Blue/Green deployment** : Déploiement sans interruption de service

### 🎯 Évolutivité
- **Architecture modulaire** : Séparer clairement les responsabilités (API, cache, UI)
- **API versioning** : Préparer l'évolution de l'API (/v1/, /v2/)
- **Feature flags** : Tester les nouvelles fonctionnalités progressivement
- **Scalabilité horizontale** : Préparer l'architecture pour supporter plus d'utilisateurs

### Autre

- DRY ; KISS etc..