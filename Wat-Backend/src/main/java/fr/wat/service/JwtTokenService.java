package fr.wat.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Service for generating and validating JWT refresh tokens.
 * Tokens are signed with HS512 and include a refresh expiration time.
 */
@Service
public class JwtTokenService {

    @Value("${jwt.secret:your-secret-key-change-this-in-production-at-least-32-chars}")
    private String jwtSecret;

    @Value("${jwt.refresh-expiration:2592000000}") // 30 days default
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("❌ JWT secret not configured. Set jwt.secret property.");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generates a refresh token for the given Discord ID.
     * 
     * @param discordId the Discord user ID
     * @return signed JWT token
     * @throws IllegalArgumentException if discordId is null or blank
     */
    public String generateRefreshToken(String discordId) {
        if (discordId == null || discordId.isBlank()) {
            System.err.println("❌ Cannot generate refresh token: discordId is null or blank");
            throw new IllegalArgumentException("discordId cannot be null or blank");
        }

        try {
            long now = System.currentTimeMillis();
            long expiryDate = now + refreshTokenExpiration;

            String token = Jwts.builder()
                    .subject(discordId)
                    .issuedAt(new Date(now))
                    .expiration(new Date(expiryDate))
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();

            System.out.println("✅ Refresh token generated for user: " + discordId);
            return token;
        } catch (Exception e) {
            System.err.println("❌ Error generating refresh token for user " + discordId + ": " + e.getMessage());
            throw new RuntimeException("Failed to generate refresh token", e);
        }
    }

    /**
     * Validates a refresh token without extracting claims.
     * 
     * @param token the JWT token to validate
     * @return true if token is valid and not expired, false otherwise
     */
    public boolean validateRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            System.err.println("❌ Token validation failed: token is null or blank");
            return false;
        }

        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            
            System.out.println("ℹ️ Refresh token validation successful");
            return true;
        } catch (ExpiredJwtException e) {
            System.err.println("⏰ Refresh token has expired");
            return false;
        } catch (JwtException e) {
            System.err.println("❌ Invalid refresh token: " + e.getClass().getSimpleName());
            return false;
        } catch (Exception e) {
            System.err.println("❌ Unexpected error during token validation: " + e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the Discord ID from a valid refresh token.
     * 
     * @param token the JWT token
     * @return the Discord ID (subject) or null if extraction fails
     */
    public String getDiscordIdFromToken(String token) {
        if (token == null || token.isBlank()) {
            System.err.println("❌ Cannot extract discord ID: token is null or blank");
            return null;
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String discordId = claims.getSubject();
            System.out.println("✅ Discord ID extracted from refresh token");
            return discordId;
        } catch (ExpiredJwtException e) {
            System.err.println("⏰ Cannot extract discord ID: refresh token has expired");
            return null;
        } catch (JwtException e) {
            System.err.println("❌ Cannot extract discord ID: invalid token - " + e.getClass().getSimpleName());
            return null;
        } catch (Exception e) {
            System.err.println("❌ Unexpected error extracting discord ID from token: " + e.getMessage());
            return null;
        }
    }
}
