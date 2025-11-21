package fr.wat.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Iterator;

/**
 * Simple per-session watchlist controller.
 * Stores a user's watchlist in the HTTP session (demo only).
 */
@RestController
@RequestMapping("/api/user")
public class WatchlistController {

    private final ObjectMapper mapper = new ObjectMapper();

    private ArrayNode getSessionList(HttpSession session) {
        if (session == null) return mapper.createArrayNode();
        Object obj = session.getAttribute("watchlist");
        if (obj instanceof ArrayNode) return (ArrayNode) obj;
        if (obj instanceof JsonNode && ((JsonNode) obj).isArray()) return (ArrayNode) obj;
        return mapper.createArrayNode();
    }

    @GetMapping("/watchlist")
    public JsonNode getWatchlist(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return mapper.createArrayNode();
        ArrayNode list = getSessionList(session);
        return list;
    }

    @PostMapping("/watchlist")
    public JsonNode addToWatchlist(HttpServletRequest req, @RequestBody JsonNode item) {
        HttpSession session = req.getSession(true);
        ArrayNode list = getSessionList(session);

        // avoid duplicates by mal_id/id/slug
        String id = null;
        if (item.has("mal_id")) id = item.get("mal_id").asText();
        else if (item.has("id")) id = item.get("id").asText();
        else if (item.has("slug")) id = item.get("slug").asText();

        boolean exists = false;
        for (JsonNode n : list) {
            String nid = n.has("mal_id") ? n.get("mal_id").asText() : (n.has("id") ? n.get("id").asText() : (n.has("slug") ? n.get("slug").asText() : null));
            if (nid != null && nid.equals(id)) { exists = true; break; }
        }

        if (!exists) {
            // ensure we store an object node
            ObjectNode toAdd = mapper.createObjectNode();
            if (item.has("mal_id")) toAdd.set("mal_id", item.get("mal_id"));
            if (item.has("id")) toAdd.set("id", item.get("id"));
            if (item.has("slug")) toAdd.set("slug", item.get("slug"));
            if (item.has("title")) toAdd.set("title", item.get("title"));
            if (item.has("title_english")) toAdd.set("title_english", item.get("title_english"));
            if (item.has("images")) toAdd.set("images", item.get("images"));
            list.insert(0, toAdd);
            session.setAttribute("watchlist", list);
        }

        return list;
    }

    @DeleteMapping("/watchlist/{id}")
    public JsonNode removeFromWatchlist(HttpServletRequest req, @PathVariable String id) {
        HttpSession session = req.getSession(false);
        if (session == null) return mapper.createArrayNode();
        ArrayNode list = getSessionList(session);

        Iterator<JsonNode> it = list.iterator();
        while (it.hasNext()) {
            JsonNode n = it.next();
            String nid = n.has("mal_id") ? n.get("mal_id").asText() : (n.has("id") ? n.get("id").asText() : (n.has("slug") ? n.get("slug").asText() : null));
            if (nid != null && nid.equals(id)) {
                it.remove();
                break;
            }
        }
        session.setAttribute("watchlist", list);
        return list;
    }

    @PostMapping("/watchlist/clear")
    public JsonNode clearWatchlist(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return mapper.createArrayNode();
        ArrayNode list = mapper.createArrayNode();
        session.setAttribute("watchlist", list);
        return list;
    }
}
