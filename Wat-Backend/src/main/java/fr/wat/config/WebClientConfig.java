package fr.wat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Qualifier;

@Configuration
public class WebClientConfig {
    
    @Bean
    @Qualifier("kitsuClient")
    public WebClient kitsuClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://kitsu.io/api/edge")
                .defaultHeader("Accept", "application/vnd.api+json")
                .defaultHeader("Content-Type", "application/vnd.api+json")
                .build();
    }

    @Bean
    @Qualifier("jikanClient")
    public WebClient jikanClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://api.jikan.moe/v4")
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean
    @Qualifier("tmdbClient")
    public WebClient tmdbClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://api.themoviedb.org/3")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}