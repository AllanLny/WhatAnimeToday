package fr.wat.repository;

import fr.wat.model.RefreshToken;
import fr.wat.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUser(UserEntity user);
    void deleteByToken(String token);
}
