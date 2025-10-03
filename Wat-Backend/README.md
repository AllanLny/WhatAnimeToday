# WAT Backend

Backend Spring Boot pour l'application What Anime Today.

## Prérequis
- Java 17
- Maven 3.6+

## Démarrage

```bash
# Compiler et démarrer l'application
mvn spring-boot:run

# Ou compiler puis exécuter
mvn clean install
java -jar target/wat-backend-0.0.1-SNAPSHOT.jar
```

## URLs importantes

- Application : http://localhost:8080
- Base de données H2 Console : http://localhost:8080/h2-console
- Documentation API (Swagger) : http://localhost:8080/swagger-ui.html
- API Docs : http://localhost:8080/api-docs

## Configuration H2

- JDBC URL: `jdbc:h2:mem:watdb`
- Username: `sa`
- Password: `password`

## Structure du projet

```
Wat-Backend/
├── src/main/java/fr/wat/
│   ├── WatBackendApplication.java          # Application principale
│   ├── config/
│   │   └── SecurityConfig.java             # Configuration sécurité et CORS
│   ├── controller/
│   │   └── AuthController.java             # Contrôleurs API d'authentification
│   ├── dto/
│   │   ├── JwtResponse.java                # Réponse JWT
│   │   ├── UserLoginDto.java               # DTO de connexion
│   │   └── UserRegistrationDto.java        # DTO d'inscription
│   ├── entity/
│   │   ├── User.java                       # Entité utilisateur
│   │   └── UserAnime.java                  # Entité anime suivi par l'utilisateur
│   └── repository/
│       ├── UserRepository.java             # Repository utilisateur
│       └── UserAnimeRepository.java        # Repository anime utilisateur
├── src/main/resources/
│   └── application.properties              # Configuration de l'application
└── src/test/java/fr/wat/
    └── WatBackendApplicationTests.java     # Tests unitaires
```

## API Endpoints

### Authentification
- `POST /api/auth/signup` - Inscription d'un nouvel utilisateur
- `POST /api/auth/signin` - Connexion d'un utilisateur
- `GET /api/auth/` - Test de santé de l'API

## Technologies utilisées

- **Spring Boot 3.3.0** - Framework Java
- **Spring Security** - Sécurité et authentification
- **Spring Data JPA** - Persistance des données
- **H2 Database** - Base de données en mémoire (développement)
- **PostgreSQL** - Base de données production
- **JWT** - Authentification par token
- **Swagger/OpenAPI** - Documentation API
- **Maven** - Gestionnaire de dépendances