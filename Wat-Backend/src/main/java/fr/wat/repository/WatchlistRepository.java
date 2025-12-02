package fr.wat.repository;

import fr.wat.model.WatchlistItem;
import fr.wat.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByUser(UserEntity user);
}
