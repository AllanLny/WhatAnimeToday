package fr.wat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * Simple OAuth2 controller for Discord login. No DB: user info stored in session and a lightweight cookie.
 * Security: this is intended for dev/demo. For production use a signed JWT or persistent sessions + CSRF protections.
 */
@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final WebClient.Builder webClientBuilder;
    private final Environment env;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AuthController(WebClient.Builder webClientBuilder, Environment env) {
        this.webClientBuilder = webClientBuilder;
        this.env = env;
    }

    @GetMapping("/discord")
    public void startDiscordAuth(@RequestParam(required = false) String redirect, HttpServletResponse resp, HttpServletRequest req) throws Exception {
        String clientId = env.getProperty("discord.client.id", env.getProperty("DISCORD_CLIENT_ID", ""));
        String redirectUri = env.getProperty("discord.redirect.uri", env.getProperty("DISCORD_REDIRECT_URI", "http://localhost:8080/api/auth/discord/callback"));
        if (clientId == null || clientId.isBlank()) {
            resp.sendError(500, "Discord client id not configured");
            return;
        }

        String state = UUID.randomUUID().toString();
        HttpSession session = req.getSession(true);
        session.setAttribute("oauth_state", state);
        if (redirect != null && !redirect.isBlank()) session.setAttribute("oauth_redirect", redirect);

        String scope = URLEncoder.encode("identify email", StandardCharsets.UTF_8);
        String url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + clientId
                + "&scope=" + scope
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&state=" + state
                + "&prompt=consent";

        resp.sendRedirect(url);
    }

    @GetMapping("/discord/callback")
    public void discordCallback(@RequestParam(required = false) String code, @RequestParam(required = false) String state,
                                HttpServletRequest req, HttpServletResponse resp) throws Exception {
        HttpSession session = req.getSession(false);
        String redirectTo = session == null ? null : (String) session.getAttribute("oauth_redirect");

        try {
            String expected = session == null ? null : (String) session.getAttribute("oauth_state");
            if (expected == null || state == null || !expected.equals(state) || code == null) {
                // redirect to frontend login (avoid server-side /login static lookup)
                String suffix = "oauth_error=invalid_state";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            String clientId = env.getProperty("discord.client.id", env.getProperty("DISCORD_CLIENT_ID", ""));
            String clientSecret = env.getProperty("discord.client.secret", env.getProperty("DISCORD_CLIENT_SECRET", ""));
            String redirectUri = env.getProperty("discord.redirect.uri", env.getProperty("DISCORD_REDIRECT_URI", "http://localhost:8080/api/auth/discord/callback"));

            if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
                String suffix = "oauth_error=config_missing";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            WebClient wc = webClientBuilder.build();

            // Exchange code for token
            JsonNode tokenResp = null;
            try {
                // Add Basic Authorization header (recommended by Discord docs)
                String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));

                tokenResp = wc.post()
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
                    System.out.println("ℹ️ OAuth token response: " + tokenResp.toString());
                }
            } catch (Exception ex) {
                System.err.println("❌ OAuth token exchange failed: " + ex.getMessage());
                ex.printStackTrace();
            }

            if (tokenResp == null || !tokenResp.has("access_token")) {
                String suffix = "oauth_error=token_failed";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            String accessToken = tokenResp.get("access_token").asText();

            // Fetch user info
            JsonNode userResp = null;
            try {
                userResp = wc.get()
                        .uri("https://discord.com/api/users/@me")
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .block();
            } catch (Exception ex) {
                System.err.println("❌ OAuth user fetch failed: " + ex.getMessage());
            }

            if (userResp == null) {
                String suffix = "oauth_error=user_failed";
                resp.sendRedirect(buildRedirectTarget(redirectTo, suffix));
                return;
            }

            // Store minimal info in session
            session.setAttribute("discord_user", userResp);

            // Also set a small cookie for frontend convenience (not HttpOnly so JS can read)
            String compact = objectMapper.writeValueAsString(Map.of(
                    "id", userResp.has("id") ? userResp.get("id").asText() : "",
                    "username", userResp.has("username") ? userResp.get("username").asText() : "",
                    "discriminator", userResp.has("discriminator") ? userResp.get("discriminator").asText() : "",
                    "avatar", userResp.has("avatar") ? userResp.get("avatar").asText() : ""
            ));
            String encoded = Base64.getUrlEncoder().encodeToString(compact.getBytes(StandardCharsets.UTF_8));
            jakarta.servlet.http.Cookie c = new jakarta.servlet.http.Cookie("WAT_USER", encoded);
            c.setPath("/");
            c.setMaxAge(7 * 24 * 3600);
            // not HttpOnly so frontend can read; in prod you should use HttpOnly + secure JWT
            resp.addCookie(c);

            // Redirect back to frontend (if provided) or to root
            String just = "justLogged=1";
            resp.sendRedirect(buildRedirectTarget(redirectTo, just));

        } catch (Exception e) {
            System.err.println("❌ Unhandled OAuth error: " + e.getMessage());
            String target = "/login";
            try { resp.sendRedirect(target + "?oauth_error=unexpected"); } catch (Exception ex) {}
        }
    }

    @GetMapping("/me")
    @ResponseBody
    public JsonNode me(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return objectMapper.createObjectNode();
        Object u = session.getAttribute("discord_user");
        if (u instanceof JsonNode) return (JsonNode) u;
        return objectMapper.createObjectNode();
    }

    @PostMapping("/logout")
    @ResponseBody
    public Map<String, Object> logout(HttpServletRequest req, HttpServletResponse resp) {
        HttpSession session = req.getSession(false);
        if (session != null) session.invalidate();
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("WAT_USER", "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        resp.addCookie(cookie);
        return Map.of("success", true);
    }

    /**
     * Build a redirect URL for frontend targets.
     * If redirectTo is an absolute URL (http/https) we use it.
     * If redirectTo is a path (starts with '/') and app.frontend.url is configured,
     * we prefix it with that frontend base. Otherwise we fallback to '/'.
     * The suffix should be the query (without leading ?), e.g. "oauth_error=..."
     */
    private String buildRedirectTarget(String redirectTo, String suffix) {
        String frontendBase = env.getProperty("app.frontend.url", "").trim();
        String target = (redirectTo != null && !redirectTo.isBlank()) ? redirectTo : "/login";

        // if absolute URL, just append suffix
        if (target.startsWith("http://") || target.startsWith("https://")) {
            return appendSuffix(target, suffix);
        }

        // if we have a configured frontend base and target is a path, prefix it
        if (!frontendBase.isBlank()) {
            String base = frontendBase.replaceAll("/+$", "");
            String path = target.startsWith("/") ? target : ("/" + target);
            return appendSuffix(base + path, suffix);
        }

        // fallback: avoid redirecting to server-side '/login' (can cause "No static resource login.")
        String fallback = "/";
        String finalTarget = ("/login".equals(target) || target.isBlank()) ? fallback : target;
        return appendSuffix(finalTarget, suffix);
    }

    private String appendSuffix(String url, String suffix) {
        if (suffix == null || suffix.isBlank()) return url;
        return url + (url.contains("?") ? "&" : "?") + suffix;
    }
}
