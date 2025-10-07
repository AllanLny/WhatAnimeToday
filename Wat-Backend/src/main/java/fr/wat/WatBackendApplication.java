package fr.wat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WatBackendApplication {
    public static void main(String[] args) {
        // Diagnostic: try to load DTO class to catch classpath issues early
        try {
            Class.forName("fr.wat.dto.GlobalStatsResponse");
            System.out.println("✅ DTO GlobalStatsResponse found on classpath");
        } catch (ClassNotFoundException e) {
            System.err.println("❌ DTO GlobalStatsResponse NOT found on classpath: " + e.getMessage());
        }

        SpringApplication.run(WatBackendApplication.class, args);
    }
}