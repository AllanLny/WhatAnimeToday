package fr.wat.util;

import java.util.Arrays;
import java.util.List;

/**
 * 🌍 Utilitaires pour la validation et gestion des pays/régions
 * Centralise la logique de validation selon les bonnes pratiques
 */
public class CountryValidator {
    
    // Pays supportés officiellement par WAT
    private static final List<String> SUPPORTED_COUNTRIES = Arrays.asList(
        "FR", "US", "JP", "GB", "UK", "DE", "ES", "IT", "BR", "CA", "AU"
    );
    
    // Pays par défaut si non spécifié ou invalide
    public static final String DEFAULT_COUNTRY = "FR";
    
    /**
     * ✅ Valide si un code pays est supporté
     */
    public static boolean isValidCountry(String country) {
        return country != null && 
               SUPPORTED_COUNTRIES.contains(country.toUpperCase());
    }
    
    /**
     * 🔧 Normalise un code pays (majuscules, validation)
     */
    public static String normalizeCountry(String country) {
        if (country == null || country.trim().isEmpty()) {
            return DEFAULT_COUNTRY;
        }
        
        String normalized = country.trim().toUpperCase();
        
        // Cas spéciaux de normalisation
        if ("UK".equals(normalized)) {
            normalized = "GB"; // Standardisation ISO
        }
        
        return isValidCountry(normalized) ? normalized : DEFAULT_COUNTRY;
    }
    
    /**
     * 📋 Retourne la liste des pays supportés
     */
    public static List<String> getSupportedCountries() {
        return List.copyOf(SUPPORTED_COUNTRIES);
    }
    
    /**
     * 🌐 Valide et normalise avec message d'erreur si besoin
     */
    public static String validateAndNormalize(String country) throws IllegalArgumentException {
        if (country == null) {
            return DEFAULT_COUNTRY;
        }
        
        String normalized = normalizeCountry(country);
        
        if (!isValidCountry(normalized)) {
            throw new IllegalArgumentException(
                "Pays non supporté: " + country + 
                ". Pays supportés: " + String.join(", ", SUPPORTED_COUNTRIES)
            );
        }
        
        return normalized;
    }
    
    /**
     * 🗺️ Récupère le nom complet du pays pour l'affichage
     */
    public static String getCountryDisplayName(String countryCode) {
        switch (countryCode.toUpperCase()) {
            case "FR":
                return "France";
            case "US":
                return "États-Unis";
            case "JP":
                return "Japon";
            case "GB":
            case "UK":
                return "Royaume-Uni";
            case "DE":
                return "Allemagne";
            case "ES":
                return "Espagne";
            case "IT":
                return "Italie";
            case "BR":
                return "Brésil";
            case "CA":
                return "Canada";
            case "AU":
                return "Australie";
            default:
                return countryCode;
        }
    }
}