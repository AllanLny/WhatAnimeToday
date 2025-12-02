package fr.wat.service;

import fr.wat.model.UserEntity;
import fr.wat.model.WatchlistItem;
import fr.wat.repository.UserRepository;
import fr.wat.repository.WatchlistRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;

    public WatchlistService(WatchlistRepository watchlistRepository, UserRepository userRepository) {
        this.watchlistRepository = watchlistRepository;
        this.userRepository = userRepository;
    }

    public List<WatchlistItem> getForUser(UserEntity user) {
        return watchlistRepository.findByUser(user);
    }

    public WatchlistItem addForUser(UserEntity user, WatchlistItem item) {
        item.setUser(user);
        return watchlistRepository.save(item);
    }

    public void removeForUser(UserEntity user, Long id) {
        watchlistRepository.findById(id).ifPresent(item -> {
            if (item.getUser().getId().equals(user.getId())) watchlistRepository.delete(item);
        });
    }

    public void clearForUser(UserEntity user) {
        var items = watchlistRepository.findByUser(user);
        watchlistRepository.deleteAll(items);
    }
}
