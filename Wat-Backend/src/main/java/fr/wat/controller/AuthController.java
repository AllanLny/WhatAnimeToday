package fr.wat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fr.wat.model.UserEntity;
import fr.wat.repository.UserRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * OAuth2 controller for Discord login with session-based authentication.
 * Uses HttpOnly secure cookies for persistent sessions.
 * Simple session-based approach, no JWT needed for MVP.
 */
@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final WebClient.Builder webClientBuilder;
    private final Environment env;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository;

    @Autowired
    public AuthController(WebClient.Builder webClientBuilder, Environment env, 
                         UserRepository userRepository) {
        this.webClientBuilder = webClientBuilder;
        this.env = env;
        this.userRepository = userRepository;
    }

    @GetMapping("/discord")
    public void startDiscordAuth(@RequestParam(required = false) String redirect, HttpServletResponse resp, HttpServletRequest req) throws Exception {
        String clientId = env.getProperty("discord.client.id", env.getProperty("DISCORD_CLIENT_ID", ""));
        String redirectUri = env.getProperty("discord.redirect.uri", env.getProperty("DISCORD_REDIRECT_URI", "http://localhost:8080/api/auth/discord/callback"));
        
        if (clientId == null || clientId.isBlank()) {
            System.err.println("❌ Discord client ID not configured");
            resp.sendError(500, "Discord client id not configured");
            return;
        }

        String state = UUID.randomUUID().toString();
        HttpSession session = req.getSession(true);
        session.setAttribute("oauth_state", state);
        if (redirect != null && !redirect.isBlank()) {
            session.setAttribute("oauth_redirect", redirect);
        }

        String scope = URLEncoder.encode("identify email", StandardCharsets.UTF_8);
        String url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + clientId
                + "&scope=" + scope
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&state=" + state
                + "&prompt=consent";

        System.out.println("🌐 Redirecting to Discord OAuth for authorization");
        resp.sendRedirect(url);
    }

    @GetMapping("/discord/callback")
    public void discordCallback(@RequestParam(required = false) String code, @RequestParam(required = false) String state,
                                HttpServletRequest req, HttpServletResponse resp) throws Exception {
        HttpSession session = req.getSession(false);
        String redirectTo = session == null ? null : (String) session.getAttribute("oauth_redirect");

        try {
            // Validate state parameter
            String expectedState = session == null ? null : (String) session.getAttribute("oauth_state");
            if (expectedState == null || state == null || !expectedState.equals(state) || code == null) {
                System.err.println("❌ OAuth state mismatch or missing code");
                String suffix = "oauth_error=invalid_state";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            String clientId = env.getProperty("discord.client.id", env.getProperty("DISCORD_CLIENT_ID", ""));
            String clientSecret = env.getProperty("discord.client.secret", env.getProperty("DISCORD_CLIENT_SECRET", ""));
            String redirectUri = env.getProperty("discord.redirect.uri", env.getProperty("DISCORD_REDIRECT_URI", "http://localhost:8080/api/auth/discord/callback"));

            if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
                System.err.println("❌ Discord configuration missing");
                String suffix = "oauth_error=config_missing";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            // Exchange authorization code for access token
            JsonNode tokenResp = exchangeCodeForToken(clientId, clientSecret, redirectUri, code);
            if (tokenResp == null || !tokenResp.has("access_token")) {
                System.err.println("❌ Failed to obtain access token");
                String suffix = "oauth_error=token_failed";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            String accessToken = tokenResp.get("access_token").asText();

            // Fetch user info from Discord
            JsonNode userResp = fetchDiscordUserInfo(accessToken);
            if (userResp == null) {
                System.err.println("❌ Failed to fetch Discord user info");
                String suffix = "oauth_error=user_failed";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            String discordId = userResp.has("id") ? userResp.get("id").asText() : null;
            if (discordId == null) {
                System.err.println("❌ No Discord ID in user response");
                String suffix = "oauth_error=no_discord_id";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            // Store/update user in database
            storeOrUpdateUser(userResp, discordId);

            // Store user info in session
            session = req.getSession(true);
            session.setAttribute("discord_user", userResp);
            System.out.println("✅ Discord callback successful for user: " + discordId);

            // Redirect back to frontend
            String suffix = "justLogged=1";
            resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));

        } catch (Exception e) {
            System.err.println("❌ Unhandled OAuth error: " + e.getMessage());
            e.printStackTrace();
            try {
                resp.sendRedirect(buildRedirectTarget(redirectTo, "oauth_error=unexpected"));
            } catch (Exception ex) {
                System.err.println("❌ Failed to redirect on error: " + ex.getMessage());
            }
        }
    }

    @GetMapping("/me")
    @ResponseBody
    public JsonNode me(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return objectMapper.createObjectNode();
        
        Object user = session.getAttribute("discord_user");
        if (user instanceof JsonNode) {
            return (JsonNode) user;
        }
        return objectMapper.createObjectNode();
    }

    @PostMapping("/logout")
    @ResponseBody
    public Map<String, Object> logout(HttpServletRequest req, HttpServletResponse resp) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
            System.out.println("🔓 Session invalidated");
        }

        // Clear user cookie
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("WAT_USER", "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        resp.addCookie(cookie);

        System.out.println("✅ User logged out successfully");
        return Map.of("success", true);
    }

    // ============ Private helper methods ============

    private JsonNode exchangeCodeForToken(String clientId, String clientSecret, String redirectUri, String code) {
        try {
            String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
            WebClient wc = webClientBuilder.build();

            JsonNode tokenResp = wc.post()
                    .uri("https://discord.com/api/oauth2/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("Authorization", "Basic " + basic)
                    .body(BodyInserters.fromFormData("client_id", clientId)
                            .with("client_secret", clientSecret)
                            .with("grant_type", "authorization_code")
                            .with("code", code)
                            .with("redirect_uri", redirectUri))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (tokenResp != null) {
                System.out.println("ℹ️ OAuth token exchange successful");
            }
            return tokenResp;
        } catch (Exception ex) {
            System.err.println("❌ OAuth token exchange failed: " + ex.getMessage());
            return null;
        }
    }

    private JsonNode fetchDiscordUserInfo(String accessToken) {
        try {
            WebClient wc = webClientBuilder.build();
            JsonNode userResp = wc.get()
                    .uri("https://discord.com/api/users/@me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (userResp != null) {
                System.out.println("ℹ️ Discord user info fetched successfully");
            }
            return userResp;
        } catch (Exception ex) {
            System.err.println("❌ Failed to fetch Discord user info: " + ex.getMessage());
            return null;
        }
    }

    private void storeOrUpdateUser(JsonNode userResp, String discordId) {
        Optional<UserEntity> existingUser = userRepository.findByDiscordId(discordId);
        UserEntity user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            updateUserInfo(user, userResp);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
            System.out.println("✅ Updated existing user: " + discordId);
        } else {
            user = new UserEntity();
            user.setDiscordId(discordId);
            updateUserInfo(user, userResp);
            userRepository.save(user);
            System.out.println("✅ Created new user: " + discordId);
        }
    }

    private void updateUserInfo(UserEntity user, JsonNode userResp) {
        if (userResp.has("username")) user.setUsername(userResp.get("username").asText());
        if (userResp.has("discriminator")) user.setDiscriminator(userResp.get("discriminator").asText());
        if (userResp.has("avatar")) user.setAvatar(userResp.get("avatar").asText());
    }

    private boolean isSecure(HttpServletRequest req) {
        return req.isSecure() || "https".equalsIgnoreCase(req.getScheme());
    }

    private String buildRedirectTarget(String redirectTo, String suffix) {
        String frontendBase = env.getProperty("app.frontend.url", "").trim();
        String target = (redirectTo != null && !redirectTo.isBlank()) ? redirectTo : "/login";

        // If absolute URL, append suffix directly
        if (target.startsWith("http://") || target.startsWith("https://")) {
            return appendSuffix(target, suffix);
        }

        // If frontend base is configured, use it for relative paths
        if (!frontendBase.isBlank()) {
            String base = frontendBase.replaceAll("/+$", "");
            String path = target.startsWith("/") ? target : ("/" + target);
            return appendSuffix(base + path, suffix);
        }

        // Fallback: avoid redirecting to server-side /login to prevent static resource errors
        String fallback = "/";
        String finalTarget = ("/login".equals(target) || target.isBlank()) ? fallback : target;
        return appendSuffix(finalTarget, suffix);
    }

    private String appendSuffix(String url, String suffix) {
        if (suffix == null || suffix.isBlank()) return url;
        return url + (url.contains("?") ? "&" : "?") + suffix;
    }
}
