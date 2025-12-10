package fr.wat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration Web MVC pour WAT
 * Gère les ressources statiques et le routage SPA
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    /**
     * Configuration des ressources statiques
     * Permet de servir les fichiers CSS, JS, images, etc.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir les ressources statiques depuis classpath
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
        
        registry.addResourceHandler("/public/**")
                .addResourceLocations("classpath:/public/");
        
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/");
        
        // Pour les fichiers favicon, manifest, etc.
        registry.addResourceHandler("/*.ico", "/*.png", "/*.svg", "/*.json")
                .addResourceLocations("classpath:/static/");
                
        // Ne pas interférer avec les ressources par défaut de Spring Boot
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
    }
    
    /**
     * Configuration pour SPA (Single Page Application)
     * Redirige toutes les routes frontend vers index.html
     * MAIS évite les routes API
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Pour les routes SPA, on peut rediriger vers la page React
        // Mais dans notre cas, le frontend est servi par Vite en dev
        // et par un serveur différent en production, donc on ne fait rien ici
    }
}