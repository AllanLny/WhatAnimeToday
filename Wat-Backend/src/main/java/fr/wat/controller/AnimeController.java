package fr.wat.controller;

import fr.wat.service.AnimeDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/anime")
@CrossOrigin(origins = "http://localhost:5173")
public class AnimeController {
    
    @Autowired
    private AnimeDataService animeDataService;
    
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