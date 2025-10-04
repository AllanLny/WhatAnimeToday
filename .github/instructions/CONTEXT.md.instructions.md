---
applyTo: '**'
---

# Instructions pour le projet WAT (What Anime Today)

## 🎯 Vision et Objectifs
Toujours garder en tête que WAT est une application **simple, moderne et intuitive** qui centralise les sorties d'animes du jour. L'objectif principal est de répondre à la question : **"Quoi regarder aujourd'hui ?"**

## 🏗️ Architecture Technique
- **Backend** : Java 17 + Spring Boot 3
- **Frontend** : React + Vite + SCSS
- **APIs** : Jikan (MyAnimeList), Kitsu, TMDB
- **Cache** : Caffeine Cache avec stratégie par pays et par jour
- **Base de données** : À définir selon les besoins futurs
- **Copilot** : Pas de creation de fichier temporaire ou de nouvelle version de fichier. Utiliser uniquement pour suggestions dans les fichiers existants. Tu peux créer de nouveau fichier si nécessaire (Donc si pas deja existant).

## 📋 Bonnes Pratiques Obligatoires

### Performance & Cache
- **TOUJOURS** implémenter un cache pour les appels API externes
- Cache stratifié : par pays (`FR`, `US`, etc.) et par type de données
- TTL : 24h pour sorties quotidiennes, 1h pour détails anime
- Utiliser `@Cacheable` avec des clés spécifiques (`#country`, `#day`)
- Front end : Utiliser TanStack Query pour le cache côté client

### APIs Externes
- **Retry logic** obligatoire avec backoff exponentiel
- **Fallback systems** : Jikan → Kitsu → cache local
- **Rate limiting** : Respecter 3 req/sec pour Jikan
- Logger tous les échecs d'API avec détails

### Code Quality
- **Mobile-first** : Toujours designer pour mobile d'abord
- **Tests unitaires** sur la logique métier
- **Validation stricte** de toutes les entrées
- **Error handling** avec messages utilisateur clairs

## 🎨 Standards de Code

### Backend Java
```java
// Toujours utiliser des noms explicites liés au domaine
@Cacheable(value = "todayReleases", key = "#country")
public JsonNode getTodayReleases(String country) {
    // Logs structurés avec émojis pour faciliter le debug
    System.out.println("🌐 API Call Jikan pour " + country);
    
    // Toujours gérer les exceptions avec contexte
    try {
        // Logique métier
    } catch (Exception e) {
        System.err.println("❌ Erreur API pour " + country + ": " + e.getMessage());
        throw new RuntimeException("Message utilisateur clair", e);
    }
}
```

### Frontend React
```javascript
// Utiliser TanStack Query pour le cache côté client
// Toujours avoir des loading states et error boundaries
// Noms de variables en français pour le domaine métier
const { data: animesAujourdhui, isLoading, error } = useQuery({
    queryKey: ['today-releases', country],
    queryFn: () => fetchTodayReleases(country),
    staleTime: 24 * 60 * 60 * 1000 // 24h
});
```

### SCSS
```scss
// Utiliser @use au lieu de @import
@use '../variables' as vars;

// Mobile-first avec breakpoints clairs
.anime-card {
    // Mobile par défaut
    padding: vars.$spacing-sm;
    
    // Desktop en media query
    @media (min-width: vars.$breakpoint-md) {
        padding: vars.$spacing-md;
    }
}
```

## 🚨 Priorités et Contraintes

### Must-Have (Indispensable)
1. **Performance** : L'app doit être rapide, cache obligatoire
2. **Mobile-first** : Responsive design prioritaire
3. **APIs fiables** : Retry + fallback + monitoring
4. **UX simple** : Pas d'usine à gaz, interface claire

### Nice-to-Have (Souhaitable)
1. Recommandations personnalisées
2. Aspect social/communautaire
3. Notifications push
4. Mode hors ligne

### Contraintes Techniques
- **Budget limité** : Solutions gratuites privilégiées
- **Projet solo** : Code maintenable et documenté
- **Évolutivité** : Architecture modulaire pour futures fonctionnalités
- **Légalité** : Toujours pointer vers plateformes légales

## 🎯 Public Cible
**Fans d'animes francophones/anglophones** (ados, jeunes adultes, étudiants) utilisant des plateformes légales comme Crunchyroll, ADN, Netflix.

## 📊 Métriques de Succès
- Temps de chargement < 2s
- Taux d'erreur API < 5%
- Interface utilisable sur mobile sans zoom
- Cache hit ratio > 80%

## 💡 Philosophie de Développement
- **Simplicité avant tout** : Mieux vaut une fonctionnalité simple qui marche qu'une complexe qui bug
- **Itératif** : MVP d'abord, puis amélioration continue
- **User-centric** : Chaque décision doit servir l'expérience utilisateur
- **Robustesse** : L'app doit fonctionner même si une API est down