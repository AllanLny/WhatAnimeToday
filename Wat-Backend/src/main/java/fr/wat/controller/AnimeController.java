package fr.wat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import fr.wat.dto.ApiResponse;
import fr.wat.service.AnimeDataService;
import fr.wat.service.StatisticsService;
import fr.wat.util.CountryValidator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 🎬 Contrôleur principal pour les APIs anime de WAT
 * Architecture MVC propre avec séparation des responsabilités
 */
@RestController
@RequestMapping("/api/anime")
@CrossOrigin(origins = "http://localhost:5173")
public class AnimeController {
    
    private final AnimeDataService animeDataService;
    private final StatisticsService statisticsService;
    
    public AnimeController(AnimeDataService animeDataService, StatisticsService statisticsService) {
        this.animeDataService = animeDataService;
        this.statisticsService = statisticsService;
    }
    
    /**
     * Récupère les sorties d'anime du jour pour tous les pays
     */
    @GetMapping("/today/all-countries")
    public ResponseEntity<Map<String, Object>> getTodayReleasesAllCountries() {
        
        try {
            var data = animeDataService.getTodayReleasesAllCountries();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("scope", "all_countries");
            response.put("timestamp", LocalDateTime.now());
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des données pour tous les pays: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Récupère les sorties d'anime du jour
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayReleases(
            @RequestParam(defaultValue = "FR") String country) {
        
        try {
            var data = animeDataService.getTodayReleases(country);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("country", country);
            response.put("timestamp", LocalDateTime.now());
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des données: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Récupère le calendrier hebdomadaire
     */
    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyCalendar(
            @RequestParam(defaultValue = "FR") String country) {
        
        try {
            var data = animeDataService.getWeeklyCalendar(country);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("country", country);
            response.put("timestamp", LocalDateTime.now());
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération du calendrier: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Récupère le calendrier hebdomadaire pour tous les pays
     */
    @GetMapping("/calendar/all-countries")
    public ResponseEntity<Map<String, Object>> getWeeklyCalendarAllCountries() {
        
        try {
            var data = animeDataService.getWeeklyCalendarAllCountries();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("scope", "all_countries");
            response.put("timestamp", LocalDateTime.now());
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération du calendrier pour tous les pays: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Statistiques du cache
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> stats = animeDataService.getCacheStats();
        stats.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Vider le cache
     */
    @DeleteMapping("/cache")
    public ResponseEntity<Map<String, Object>> clearCache() {
        animeDataService.clearCache();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cache vidé avec succès");
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Récupérer les plateformes de streaming populaires par région
     */
    @GetMapping("/platforms/{country}")
    public ResponseEntity<Map<String, Object>> getPlatformsByCountry(
            @PathVariable String country) {
        
        try {
            var platforms = animeDataService.getPopularPlatformsByRegion(country);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("country", country);
            response.put("platforms", platforms);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des plateformes: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Diagnostics: compare Jikan vs Kitsu pour les sorties du jour
     */
    @GetMapping("/diagnostics/today-sources")
    public ResponseEntity<Map<String, Object>> compareTodaySources(
            @RequestParam(defaultValue = "FR") String country) {
        try {
            var report = statisticsService.compareTodaySources(country);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("country", country);
            response.put("report", report);
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur diagnostics: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 📊 Récupère les statistiques globales pour le dashboard
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats(
        @RequestParam(required = false, defaultValue = "") String country) {
        
        try {
            System.out.println("📊 Requête statistiques pour le pays: " + country);
            // Use StatisticsService which computes and caches global stats reliably
            var statsDto = statisticsService.getGlobalStats(country == null ? "" : country);

            Map<String, Object> response = new HashMap<>();
            response.put("success", statsDto != null && statsDto.isSuccess());
            response.put("country", statsDto == null ? country : statsDto.getCountry());
            response.put("todayReleases", statsDto == null ? 0 : statsDto.getTodayReleases());
            response.put("totalAnimes", statsDto == null ? 0 : statsDto.getTotalAnimes());
            response.put("activeWeek", statsDto == null ? 0 : statsDto.getActiveWeek());
            response.put("totalEpisodes", statsDto == null ? 0 : statsDto.getTotalEpisodes());
            response.put("lastUpdated", statsDto == null ? LocalDateTime.now().toString() : statsDto.getLastUpdated());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur statistiques: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des statistiques: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 🌍 Récupère la liste des pays supportés par WAT
     */
    @GetMapping("/countries")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportedCountries() {
        try {
            Map<String, Object> countriesData = new HashMap<>();
            countriesData.put("supported", CountryValidator.getSupportedCountries());
            countriesData.put("default", CountryValidator.DEFAULT_COUNTRY);
            
            // Ajouter les noms complets pour le frontend
            Map<String, String> displayNames = new HashMap<>();
            for (String code : CountryValidator.getSupportedCountries()) {
                displayNames.put(code, CountryValidator.getCountryDisplayName(code));
            }
            countriesData.put("displayNames", displayNames);
            
            ApiResponse<Map<String, Object>> response = ApiResponse.success(countriesData);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> errorResponse = 
                ApiResponse.error("Erreur lors de la récupération des pays: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    

    /**
     * Récupérer les plateformes de streaming directement via un TMDB id (sans besoin d'animeId/MAL)
     */
    @GetMapping("/tmdb/{tmdbId}/platforms")
    public ResponseEntity<Map<String, Object>> getPlatformsByTmdbId(
            @PathVariable String tmdbId,
            @RequestParam(required = false, defaultValue = "") String country) {

        try {
            // Pass an empty animeId and forward the provided TMDB id to the service
            var platforms = animeDataService.getStreamingPlatforms("", country, tmdbId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tmdbId", tmdbId);
            if (country != null && !country.isBlank()) response.put("country", country.toUpperCase());
            response.put("platforms", platforms);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des plateformes par TMDB id: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Récupérer les plateformes de streaming pour un anime identifié par son animeId (ex: MAL id)
     * Cette route est ajoutée pour conserver la compatibilité avec le frontend qui appelle
     * `/api/anime/anime/{animeId}/platforms`.
     */
    @GetMapping("/anime/{animeId}/platforms")
    public ResponseEntity<Map<String, Object>> getPlatformsByAnimeId(
            @PathVariable String animeId,
            @RequestParam(required = false, defaultValue = "") String country) {

        try {
            var platforms = animeDataService.getStreamingPlatforms(animeId, country, null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("animeId", animeId);
            if (country != null && !country.isBlank()) response.put("country", country.toUpperCase());
            response.put("platforms", platforms);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Erreur lors de la récupération des plateformes par animeId: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * DEBUG: chercher TMDB pour un titre (q) et renvoyer le résultat brute
     */
    @GetMapping("/debug/tmdb/search")
    public ResponseEntity<Map<String, Object>> debugTmdbSearch(@RequestParam String q) {
        try {
            JsonNode resp = animeDataService.debugSearchTmdb(q);
            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("query", q);
            out.put("result", resp);
            out.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            err.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * DEBUG: rechercher TMDB et récupérer les providers pour inspection
     */
    @GetMapping("/debug/tmdb/providers")
    public ResponseEntity<Map<String, Object>> debugTmdbProviders(@RequestParam String q, @RequestParam(required = false, defaultValue = "") String country) {
        try {
            JsonNode resp = animeDataService.debugTmdbProviders(q, country);
            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("query", q);
            out.put("country", country);
            out.put("data", resp);
            out.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            err.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * Resolve TMDB candidates with scoring and provider checks
     */
    @GetMapping("/tmdb/resolve")
    public ResponseEntity<Map<String, Object>> resolveTmdb(@RequestParam String q, @RequestParam(required = false) Integer year, @RequestParam(required = false, defaultValue = "FR") String country) {
        try {
            JsonNode resp = animeDataService.resolveTmdbCandidates(q, year, country);
            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("query", q);
            out.put("country", country);
            out.put("data", resp);
            out.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            err.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(500).body(err);
        }
    }
}