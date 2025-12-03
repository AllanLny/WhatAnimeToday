package fr.wat.service;

import fr.wat.model.RefreshToken;
import fr.wat.model.UserEntity;
import fr.wat.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days

    @Autowired
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Create a new refresh token for a user
     */
    public RefreshToken createRefreshToken(UserEntity user) {
        // Invalidate existing tokens for this user
        refreshTokenRepository.deleteAll(refreshTokenRepository.findByUser(user));

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(OffsetDateTime.now().plusDays(REFRESH_TOKEN_EXPIRY_DAYS));
        
        return refreshTokenRepository.save(token);
    }

    /**
     * Validate and get a refresh token
     */
    public Optional<RefreshToken> validateToken(String token) {
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(token);
        
        if (refreshToken.isPresent() && refreshToken.get().getExpiresAt().isAfter(OffsetDateTime.now())) {
            return refreshToken;
        } else if (refreshToken.isPresent()) {
            // Token expired, delete it
            refreshTokenRepository.deleteByToken(token);
        }
        
        return Optional.empty();
    }

    /**
     * Revoke a refresh token
     */
    public void revokeToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    /**
     * Revoke all tokens for a user
     */
    public void revokeAllTokens(UserEntity user) {
        refreshTokenRepository.deleteAll(refreshTokenRepository.findByUser(user));
    }
}
