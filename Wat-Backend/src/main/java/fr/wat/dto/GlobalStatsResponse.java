package fr.wat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 📊 DTO pour les statistiques globales du dashboard WAT
 * Répond aux bonnes pratiques Spring Boot avec validation et structure claire
 */
public class GlobalStatsResponse {
    
    @JsonProperty("todayReleases")
    private int todayReleases;
    
    @JsonProperty("activeWeek")
    private int activeWeek;
    
    @JsonProperty("totalEpisodes")
    private int totalEpisodes;
    
    @JsonProperty("totalAnimes")
    private int totalAnimes;
    
    @JsonProperty("country")
    private String country;
    
    @JsonProperty("lastUpdated")
    private String lastUpdated;
    
    @JsonProperty("success")
    private boolean success;
    
    // Constructeurs
    public GlobalStatsResponse() {}
    
    public GlobalStatsResponse(int todayReleases, int activeWeek, int totalEpisodes, 
                             int totalAnimes, String country, String lastUpdated, boolean success) {
        this.todayReleases = todayReleases;
        this.activeWeek = activeWeek;
        this.totalEpisodes = totalEpisodes;
        this.totalAnimes = totalAnimes;
        this.country = country;
        this.lastUpdated = lastUpdated;
        this.success = success;
    }
    
    // Getters et Setters
    public int getTodayReleases() {
        return todayReleases;
    }
    
    public void setTodayReleases(int todayReleases) {
        this.todayReleases = todayReleases;
    }
    
    public int getActiveWeek() {
        return activeWeek;
    }
    
    public void setActiveWeek(int activeWeek) {
        this.activeWeek = activeWeek;
    }
    
    public int getTotalEpisodes() {
        return totalEpisodes;
    }
    
    public void setTotalEpisodes(int totalEpisodes) {
        this.totalEpisodes = totalEpisodes;
    }
    
    public int getTotalAnimes() {
        return totalAnimes;
    }
    
    public void setTotalAnimes(int totalAnimes) {
        this.totalAnimes = totalAnimes;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    @Override
    public String toString() {
        return "GlobalStatsResponse{" +
                "todayReleases=" + todayReleases +
                ", activeWeek=" + activeWeek +
                ", totalEpisodes=" + totalEpisodes +
                ", totalAnimes=" + totalAnimes +
                ", country='" + country + '\'' +
                ", lastUpdated='" + lastUpdated + '\'' +
                ", success=" + success +
                '}';
    }
}