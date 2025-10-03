package fr.wat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnimeDataService {
    
    private final WebClient kitsuClient;
    private final WebClient jikanClient;
    private final WebClient tmdbClient;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    
    public AnimeDataService(
            @Qualifier("kitsuClient") WebClient kitsuClient,
            @Qualifier("jikanClient") WebClient jikanClient,
            @Qualifier("tmdbClient") WebClient tmdbClient,
            CacheManager cacheManager) {
        this.kitsuClient = kitsuClient;
        this.jikanClient = jikanClient;
        this.tmdbClient = tmdbClient;
        this.objectMapper = new ObjectMapper();
        this.cacheManager = cacheManager;
    }
    
    /**
     * Récupère les données du jour avec filtrage par pays (cache automatique)
     */
    @Cacheable(value = "todayReleases", key = "#country")
    public JsonNode getTodayReleases(String country) {
        System.out.println("🔄 Cache MISS pour today_releases_" + country + " - Appel API");
        
        try {
            // Récupérer les données globales de Kitsu
            JsonNode globalData = fetchTodayReleasesFromAPI();
            
            // Filtrer par pays
            return filterByCountry(globalData, country);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur API pour today releases: " + e.getMessage());
            throw new RuntimeException("Erreur lors de l'appel API Kitsu", e);
        }
    }
    
    /**
     * Récupère le calendrier avec filtrage par pays (cache automatique)
     */
    @Cacheable(value = "weeklyCalendar", key = "#country")
    public JsonNode getWeeklyCalendar(String country) {
        System.out.println("🔄 Cache MISS pour weekly_calendar_" + country + " - Appel API");
        
        try {
            // Utiliser Jikan pour le calendrier (plus précis pour les horaires)
            JsonNode globalData = fetchWeeklyCalendarFromAPI();
            
            // Filtrer par pays
            return filterByCountry(globalData, country);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur API pour weekly calendar: " + e.getMessage());
            throw new RuntimeException("Erreur lors de l'appel API Jikan", e);
        }
    }
    
    /**
     * Filtre les données par pays en tenant compte des plateformes disponibles
     * Structure Jikan: { "data": [{ "title": "...", "broadcast": {...}, "streaming": [...] }], ... }
     * Structure Kitsu: { "data": [{ "attributes": { "titles": {...}, "synopsis": "...", ... } }], ... }
     */
    private JsonNode filterByCountry(JsonNode globalData, String country) {
        try {
            System.out.println("🌍 Filtrage par pays: " + country);
            
            // Compter le nombre d'animes avant filtrage
            if (globalData.has("data") && globalData.get("data").isArray()) {
                int totalCount = globalData.get("data").size();
                System.out.println("📊 " + totalCount + " animes avant filtrage");
                
                // TODO: Implémenter le filtrage intelligent par plateformes disponibles
                // Exemples de plateformes par région:
                // France: Crunchyroll, Netflix, ADN, Wakanim
                // Japon: Toutes les plateformes
                // US: Crunchyroll, Funimation, Hulu, Netflix
                
                // Pour l'instant, retourner toutes les données
                // Le filtrage par plateformes nécessiterait une base de données
                // des disponibilités par région ou des APIs spécialisées
                
                return filterAnimesByAvailability(globalData, country);
            }
            
            return globalData;
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du filtrage par pays " + country + ": " + e.getMessage());
            return globalData;
        }
    }
    
    /**
     * Filtre les animes par disponibilité dans le pays
     */
    private JsonNode filterAnimesByAvailability(JsonNode data, String country) {
        // Pour l'instant, on applique une logique simple
        // TODO: Intégrer avec une API de géolocalisation de contenu
        
        switch (country.toUpperCase()) {
            case "FR":
            case "FRANCE":
                System.out.println("🇫🇷 Filtrage pour la France - plateformes: Crunchyroll, Netflix, ADN");
                break;
            case "US":
            case "USA":
                System.out.println("🇺🇸 Filtrage pour les US - plateformes: Crunchyroll, Funimation, Hulu");
                break;
            case "JP":
            case "JAPAN":
                System.out.println("🇯🇵 Filtrage pour le Japon - toutes les plateformes disponibles");
                break;
            default:
                System.out.println("🌐 Filtrage par défaut pour " + country);
        }
        
        // Retourner toutes les données pour l'instant
        // L'implémentation du filtrage réel nécessiterait:
        // 1. Une base de données des plateformes par région
        // 2. Des APIs pour vérifier la disponibilité
        // 3. Ou une intégration avec JustWatch/Livechart.me
        
        return data;
    }
    
    /**
     * Appel API pour les sorties du jour avec Jikan (meilleur pour les plannings quotidiens)
     */
    private JsonNode fetchTodayReleasesFromAPI() {
        try {
            // Utiliser l'endpoint schedules de Jikan pour obtenir les sorties du jour
            // Jikan retourne les animes qui sortent par jour de la semaine
            String today = java.time.LocalDate.now().getDayOfWeek().name().toLowerCase();
            
            System.out.println("📅 Récupération des sorties pour: " + today);
            
            String response = jikanClient.get()
                    .uri("/schedules/{day}", today)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode schedulesData = objectMapper.readTree(response);
            
            // Enrichir avec les informations de streaming depuis Kitsu pour chaque anime
            return enrichWithStreamingPlatforms(schedulesData);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur Jikan, fallback vers Kitsu: " + e.getMessage());
            // Fallback vers Kitsu si Jikan ne fonctionne pas
            return fetchCurrentAnimesFromKitsu();
        }
    }
    
    /**
     * Enrichir les données avec les plateformes de streaming
     */
    private JsonNode enrichWithStreamingPlatforms(JsonNode jikanData) {
        try {
            // Pour chaque anime de Jikan, essayer de récupérer ses plateformes depuis Kitsu
            if (jikanData.has("data") && jikanData.get("data").isArray()) {
                var animes = jikanData.get("data");
                
                System.out.println("🔍 Enrichissement de " + animes.size() + " animes avec les plateformes");
                
                // Pour l'instant, on retourne les données Jikan telles quelles
                // TODO: Implémenter l'enrichissement avec les plateformes Kitsu
                // Cela nécessiterait des appels supplémentaires à l'API Kitsu pour chaque anime
                
                return jikanData;
            }
            
            return jikanData;
            
        } catch (Exception e) {
            System.err.println("❌ Erreur enrichissement: " + e.getMessage());
            return jikanData;
        }
    }
    
    /**
     * Fallback: récupérer les animes en cours depuis Kitsu
     */
    private JsonNode fetchCurrentAnimesFromKitsu() {
        try {
            String response = kitsuClient.get()
                    .uri("/anime?filter[status]=current&page[limit]=20&sort=-user_count")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'appel Kitsu API", e);
        }
    }
    
    /**
     * Appel API pour le calendrier (utilise Jikan API - meilleur pour les plannings)
     */
    private JsonNode fetchWeeklyCalendarFromAPI() {
        try {
            // Récupérer le planning hebdomadaire via Jikan
            String response = jikanClient.get()
                    .uri("/schedules")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'appel Jikan API calendrier", e);
        }
    }
    
    /**
     * Récupérer les détails d'un anime depuis TMDB (optionnel)
     */
    @Cacheable(value = "animeDetails", key = "#tmdbId")
    public JsonNode getAnimeDetails(String tmdbId, String apiKey) {
        try {
            String response = tmdbClient.get()
                    .uri("/tv/{id}?api_key={key}&language=fr-FR", tmdbId, apiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'appel TMDB API", e);
        }
    }
    
    /**
     * Récupérer les plateformes de streaming pour un anime spécifique
     */
    @Cacheable(value = "animeDetails", key = "'platforms_' + #animeId")
    public JsonNode getStreamingPlatforms(String animeId) {
        try {
            // Utiliser Kitsu pour récupérer les informations de streaming
            String response = kitsuClient.get()
                    .uri("/anime/{id}/streaming-links", animeId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return objectMapper.readTree(response);
            
        } catch (Exception e) {
            System.err.println("❌ Impossible de récupérer les plateformes pour " + animeId + ": " + e.getMessage());
            
            // Retourner une structure vide en cas d'erreur
            var emptyResult = objectMapper.createObjectNode();
            emptyResult.set("data", objectMapper.createArrayNode());
            return emptyResult;
        }
    }
    
    /**
     * Obtenir les plateformes populaires par région
     */
    public Map<String, Object> getPopularPlatformsByRegion(String country) {
        Map<String, Object> platforms = new HashMap<>();
        
        switch (country.toUpperCase()) {
            case "FR":
            case "FRANCE":
                platforms.put("primary", java.util.Arrays.asList("Crunchyroll", "Netflix", "ADN"));
                platforms.put("secondary", java.util.Arrays.asList("Wakanim", "Prime Video"));
                break;
            case "US":
            case "USA":
                platforms.put("primary", java.util.Arrays.asList("Crunchyroll", "Funimation", "Netflix"));
                platforms.put("secondary", java.util.Arrays.asList("Hulu", "Prime Video", "HBO Max"));
                break;
            case "JP":
            case "JAPAN":
                platforms.put("primary", java.util.Arrays.asList("Niconico", "AbemaTV", "TVer"));
                platforms.put("secondary", java.util.Arrays.asList("Netflix", "Amazon Prime"));
                break;
            case "UK":
            case "GB":
                platforms.put("primary", java.util.Arrays.asList("Crunchyroll", "Netflix", "Funimation"));
                platforms.put("secondary", java.util.Arrays.asList("Prime Video"));
                break;
            default:
                platforms.put("primary", java.util.Arrays.asList("Crunchyroll", "Netflix"));
                platforms.put("secondary", java.util.Arrays.asList("Prime Video"));
        }
        
        platforms.put("region", country);
        return platforms;
    }
    
    /**
     * Statistiques du cache (utilise Spring Cache + Caffeine)
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            var caffeineCacheManager = (org.springframework.cache.caffeine.CaffeineCacheManager) cacheManager;
            var cacheNames = caffeineCacheManager.getCacheNames();
            
            stats.put("cacheNames", cacheNames);
            stats.put("totalCaches", cacheNames.size());
            
            // Détails pour chaque cache
            Map<String, Object> cacheDetails = new HashMap<>();
            for (String cacheName : cacheNames) {
                var cache = caffeineCacheManager.getCache(cacheName);
                if (cache != null) {
                    var nativeCache = (com.github.benmanes.caffeine.cache.Cache<?, ?>) cache.getNativeCache();
                    Map<String, Object> details = new HashMap<>();
                    details.put("size", nativeCache.estimatedSize());
                    details.put("stats", nativeCache.stats().toString());
                    cacheDetails.put(cacheName, details);
                }
            }
            stats.put("cacheDetails", cacheDetails);
            
        } catch (Exception e) {
            stats.put("error", "Impossible de récupérer les stats: " + e.getMessage());
            stats.put("cacheManager", cacheManager.getClass().getSimpleName());
        }
        
        return stats;
    }
    
    /**
     * Vider tous les caches
     */
    @CacheEvict(value = {"todayReleases", "weeklyCalendar", "animeDetails"}, allEntries = true)
    public void clearCache() {
        System.out.println("🗑️ Tous les caches vidés via Spring Cache");
    }
}