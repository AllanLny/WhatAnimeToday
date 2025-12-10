package fr.wat.exception;

import fr.wat.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 🚨 Gestionnaire global des exceptions pour WAT
 * Centralise la gestion d'erreurs selon les bonnes pratiques Spring Boot
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 📁 Gestion spécifique des ressources statiques non trouvées
     * Evite de polluer les logs avec des erreurs de ressources manquantes
     */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(Exception e, HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Pour les ressources statiques (CSS, JS, images), ne pas envoyer d'erreur JSON
        if (path.contains("/static/") || path.contains("/assets/") || 
            path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".png") || 
            path.endsWith(".ico") || path.endsWith(".svg")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        // Pour les routes API manquantes
        if (path.startsWith("/api/")) {
            ApiResponse<Object> response = ApiResponse.error(
                "Route API non trouvée: " + path
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        // Pour les autres routes, redirection vers le frontend
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
    
    /**
     * 🔧 Gestion des erreurs génériques (uniquement pour les APIs)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception e, HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Ne traiter que les routes API
        if (!path.startsWith("/api/")) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        
        System.err.println("❌ Erreur API non gérée sur " + path + ": " + e.getMessage());
        
        String errorMessage = e.getMessage();
        if (errorMessage == null || errorMessage.trim().isEmpty() || errorMessage.equals(".")) {
            errorMessage = "Erreur interne du serveur";
        }
        
        ApiResponse<Object> response = ApiResponse.error(
            "Une erreur inattendue s'est produite: " + errorMessage
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    /**
     * 🌐 Gestion des erreurs d'API externes
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleApiException(RuntimeException e, HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Ne traiter que les routes API
        if (!path.startsWith("/api/")) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        
        System.err.println("❌ Erreur API sur " + path + ": " + e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Erreur lors de l'accès aux données externes: " + e.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    /**
     * ⚠️ Gestion des arguments invalides
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(IllegalArgumentException e, HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Ne traiter que les routes API
        if (!path.startsWith("/api/")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        System.err.println("⚠️ Argument invalide sur " + path + ": " + e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Paramètre invalide: " + e.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}