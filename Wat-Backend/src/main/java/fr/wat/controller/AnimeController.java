package fr.wat.controller;

import fr.wat.dto.ApiResponse;
import fr.wat.dto.GlobalStatsResponse;
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
     * 📊 Récupère les statistiques globales pour le dashboard
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats(
            @RequestParam(required = false, defaultValue = "FR") String country) {
        
        try {
            System.out.println("📊 Requête statistiques pour le pays: " + country);
            
            Map<String, Object> stats = animeDataService.getGlobalStats(country);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("country", country);
            response.put("todayReleases", stats.get("todayReleases"));
            response.put("totalAnimes", stats.get("totalAnimes"));
            response.put("activeWeek", stats.get("activeWeek"));
            response.put("totalEpisodes", stats.get("totalEpisodes"));
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
     * Récupérer les plateformes de streaming pour un anime spécifique
     */
    @GetMapping("/anime/{animeId}/platforms")
    public ResponseEntity<Map<String, Object>> getAnimePlatforms(
            @PathVariable String animeId) {
        
        try {
            var platforms = animeDataService.getStreamingPlatforms(animeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("animeId", animeId);
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
}