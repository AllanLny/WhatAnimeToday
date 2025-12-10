package fr.wat.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Contrôleur pour la racine du site
 * Redirige vers le frontend Vite en développement
 */
@Controller
public class RootController {
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    /**
     * Rediriger la racine vers le frontend
     */
    @GetMapping("/")
    public String root() {
        return "redirect:" + frontendUrl;
    }
    
    /**
     * Page d'information pour les accès directs au backend
     */
    @GetMapping("/info")
    public String info() {
        return "redirect:" + frontendUrl;
    }
}