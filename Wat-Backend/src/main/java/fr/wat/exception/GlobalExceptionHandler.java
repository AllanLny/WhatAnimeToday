package fr.wat.exception;

import fr.wat.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * 🚨 Gestionnaire global des exceptions pour WAT
 * Centralise la gestion d'erreurs selon les bonnes pratiques Spring Boot
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 🔧 Gestion des erreurs génériques
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception e) {
        System.err.println("❌ Erreur non gérée: " + e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Une erreur inattendue s'est produite: " + e.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    /**
     * 🌐 Gestion des erreurs d'API externes
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleApiException(RuntimeException e) {
        System.err.println("❌ Erreur API: " + e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Erreur lors de l'accès aux données externes: " + e.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    /**
     * ⚠️ Gestion des arguments invalides
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(IllegalArgumentException e) {
        System.err.println("⚠️ Argument invalide: " + e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Paramètre invalide: " + e.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}