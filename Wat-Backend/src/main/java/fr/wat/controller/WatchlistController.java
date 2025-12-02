package fr.wat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fr.wat.model.UserEntity;
import fr.wat.model.WatchlistItem;
import fr.wat.repository.UserRepository;
import fr.wat.service.WatchlistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Watchlist controller with database persistence and Discord authentication.
 * Stores a user's watchlist in the database, synced across devices.
 */
@RestController
@RequestMapping("/api/user")
public class WatchlistController {

    private final ObjectMapper mapper = new ObjectMapper();
    private final WatchlistService watchlistService;
    private final UserRepository userRepository;

    @Autowired
    public WatchlistController(WatchlistService watchlistService, UserRepository userRepository) {
        this.watchlistService = watchlistService;
        this.userRepository = userRepository;
    }

    // Helper: extract Discord user info from session
    private UserEntity getAuthenticatedUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;

        JsonNode discordUser = (JsonNode) session.getAttribute("discord_user");
        if (discordUser == null) {
            System.out.println("⚠️ No Discord user in session");
            return null;
        }

        String discordId = discordUser.has("id") ? discordUser.get("id").asText() : null;
        if (discordId == null) {
            System.out.println("⚠️ No Discord ID in user info");
            return null;
        }

        // Find or create user by Discord ID
        Optional<UserEntity> existingUser = userRepository.findByDiscordId(discordId);
        UserEntity user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update user info if changed
            if (discordUser.has("username")) user.setUsername(discordUser.get("username").asText());
            if (discordUser.has("discriminator")) user.setDiscriminator(discordUser.get("discriminator").asText());
            if (discordUser.has("avatar")) user.setAvatar(discordUser.get("avatar").asText());
            user.setUpdatedAt(OffsetDateTime.now());
            user = userRepository.save(user);
        } else {
            // Create new user
            user = new UserEntity();
            user.setDiscordId(discordId);
            if (discordUser.has("username")) user.setUsername(discordUser.get("username").asText());
            if (discordUser.has("discriminator")) user.setDiscriminator(discordUser.get("discriminator").asText());
            if (discordUser.has("avatar")) user.setAvatar(discordUser.get("avatar").asText());
            user = userRepository.save(user);
            System.out.println("✅ Created new user: " + discordId);
        }

        return user;
    }

    @GetMapping("/watchlist")
    public ResponseEntity<?> getWatchlist(HttpServletRequest req) {
        UserEntity user = getAuthenticatedUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(mapper.createObjectNode().put("error", "Unauthorized"));
        }

        List<WatchlistItem> items = watchlistService.getForUser(user);
        List<JsonNode> result = items.stream().map(item -> {
            ObjectNode node = mapper.createObjectNode();
            node.put("id", item.getId());
            node.put("anime_id", item.getAnimeId());
            node.put("source", item.getSource());
            node.put("status", item.getStatus());
            node.put("note", item.getNote());
            node.put("added_at", item.getAddedAt().toString());
            node.put("updated_at", item.getUpdatedAt().toString());
            return (JsonNode) node;
        }).collect(Collectors.toList());

        System.out.println("📋 Fetched " + result.size() + " items for user " + user.getDiscordId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/watchlist")
    public ResponseEntity<?> addToWatchlist(HttpServletRequest req, @RequestBody JsonNode item) {
        UserEntity user = getAuthenticatedUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(mapper.createObjectNode().put("error", "Unauthorized"));
        }

        String animeId = null;
        if (item.has("mal_id")) animeId = item.get("mal_id").asText();
        else if (item.has("anime_id")) animeId = item.get("anime_id").asText();
        else if (item.has("id")) animeId = item.get("id").asText();

        if (animeId == null || animeId.isBlank()) {
            return ResponseEntity.badRequest().body(mapper.createObjectNode().put("error", "Missing anime_id or mal_id"));
        }

        // Create new watchlist item
        WatchlistItem watchItem = new WatchlistItem();
        watchItem.setUser(user);
        watchItem.setAnimeId(animeId);
        watchItem.setSource(item.has("source") ? item.get("source").asText() : "mal");
        watchItem.setStatus(item.has("status") ? item.get("status").asText() : "planned");
        watchItem.setNote(item.has("note") ? item.get("note").asText() : null);
        watchItem.setAddedAt(OffsetDateTime.now());

        try {
            WatchlistItem saved = watchlistService.addForUser(user, watchItem);
            System.out.println("✅ Added anime " + animeId + " to watchlist for user " + user.getDiscordId());

            ObjectNode response = mapper.createObjectNode();
            response.put("id", saved.getId());
            response.put("anime_id", saved.getAnimeId());
            response.put("status", saved.getStatus());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error adding to watchlist: " + e.getMessage());
            return ResponseEntity.badRequest().body(mapper.createObjectNode().put("error", e.getMessage()));
        }
    }

    @DeleteMapping("/watchlist/{id}")
    public ResponseEntity<?> removeFromWatchlist(HttpServletRequest req, @PathVariable String id) {
        UserEntity user = getAuthenticatedUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(mapper.createObjectNode().put("error", "Unauthorized"));
        }

        try {
            Long watchlistId = Long.parseLong(id);
            watchlistService.removeForUser(user, watchlistId);
            System.out.println("✅ Removed watchlist item " + id + " for user " + user.getDiscordId());
            return ResponseEntity.ok(mapper.createObjectNode().put("success", true));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(mapper.createObjectNode().put("error", "Invalid ID format"));
        }
    }

    @PostMapping("/watchlist/clear")
    public ResponseEntity<?> clearWatchlist(HttpServletRequest req) {
        UserEntity user = getAuthenticatedUser(req);
        if (user == null) {
            return ResponseEntity.status(401).body(mapper.createObjectNode().put("error", "Unauthorized"));
        }

        watchlistService.clearForUser(user);
        System.out.println("✅ Cleared watchlist for user " + user.getDiscordId());
        return ResponseEntity.ok(mapper.createObjectNode().put("success", true));
    }
}
