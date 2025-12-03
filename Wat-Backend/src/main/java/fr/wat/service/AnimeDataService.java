package fr.wat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.CacheManager;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.ZoneId;
import fr.wat.util.CountryValidator;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Service central fournissant des données d'anime.
 * Implémentation minimale/stub pour garantir la compilation et répondre aux besoins du controller.
 */
@Service
public class AnimeDataService {

    private final WebClient kitsuClient;
    private final WebClient jikanClient;
    private final WebClient tmdbClient;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    private final ApplicationContext applicationContext;
    private final String tmdbApiKey;
    private final boolean enableDevSample;
    // In-memory cache for Jikan schedule responses to avoid repeated requests across countries
    private final java.util.concurrent.ConcurrentHashMap<String, JsonNode> scheduleCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.ConcurrentHashMap<String, Long> scheduleCacheTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.ConcurrentHashMap<String, Long> scheduleFailureTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    // Per-anime failure timestamps to avoid hammering Jikan/TMDB for items that recently failed
    private final java.util.concurrent.ConcurrentHashMap<String, Long> detailFailureTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    // Cache for streaming platforms to avoid repeated TMDB calls for same anime
    private final java.util.concurrent.ConcurrentHashMap<String, JsonNode> streamingCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.ConcurrentHashMap<String, Long> streamingCacheTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    private final long SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000L; // 5 minutes
    private final long SCHEDULE_FAILURE_COOLDOWN_MS = 60 * 1000L; // 1 minute cooldown after failure
    private final long DETAIL_FAILURE_COOLDOWN_MS = 5 * 60 * 1000L; // 5 minutes cooldown for per-anime failures
    private final long STREAMING_CACHE_TTL_MS = 60 * 60 * 1000L; // 1 hour cache for streaming platforms
    // Delay between country requests when aggregating worldwide to avoid saturating external APIs
    private final long WORLDWIDE_REQUEST_DELAY_MS = 800L; // 800ms between requests

    public AnimeDataService(
            @Qualifier("kitsuClient") WebClient kitsuClient,
            @Qualifier("jikanClient") WebClient jikanClient,
            @Qualifier("tmdbClient") WebClient tmdbClient,
            Environment env,
            CacheManager cacheManager,
            ApplicationContext applicationContext) {
        this.kitsuClient = kitsuClient;
        this.jikanClient = jikanClient;
        this.tmdbClient = tmdbClient;
        this.objectMapper = new ObjectMapper();
        this.cacheManager = cacheManager;
        this.applicationContext = applicationContext;
        String fromEnv = env.getProperty("TMDB_API_KEY");
        String fromProps = env.getProperty("tmdb.api.key");
        this.tmdbApiKey = (fromEnv != null && !fromEnv.isBlank()) ? fromEnv : fromProps;
        this.enableDevSample = Boolean.parseBoolean(env.getProperty("WAT_DEV_SAMPLE", "false"));
        System.out.println("🟢 AnimeDataService initialisé - TMDB key present: " + (this.tmdbApiKey != null && !this.tmdbApiKey.isBlank()));
        if (this.enableDevSample) System.out.println("🟡 Mode DEV sample activé (WAT_DEV_SAMPLE=true)");
    }

    // ---------------- Public API ----------------

    @Cacheable(value = "todayReleases", key = "#country + '_' + T(java.time.LocalDate).now(T(java.time.ZoneId).of('Asia/Tokyo')).getDayOfWeek().name()")
    public JsonNode getTodayReleases(String country) {
        validateCountryOptional(country);
        System.out.println("🌐 getTodayReleases pour: " + (country == null ? "null" : country));
    ObjectNode out = objectMapper.createObjectNode();
    String normalizedCountry = (country == null || country.isBlank()) ? "" : CountryValidator.normalizeCountry(country);
    out.put("country", normalizedCountry == null ? "" : normalizedCountry);

    // Déterminer le fuseau horaire à utiliser pour calculer le "jour".
    ZoneId zone = countryToZoneId(normalizedCountry);
    System.out.println("🕒 getTodayReleases: using zone='" + zone + "' for country='" + normalizedCountry + "'");
    String dayName = LocalDate.now(zone).getDayOfWeek().name().toLowerCase();
    out.put("day", dayName);
        ArrayNode data = objectMapper.createArrayNode();

        // Preferred: try Jikan schedules for the day (e.g., /schedules/monday)
        if (!this.enableDevSample) {
            String jikanPath = "/schedules/" + dayName; // e.g. /schedules/monday

            // Use local cache to avoid repeated schedule requests across multiple country queries
            try {
                Long lastTs = scheduleCacheTimestamps.get(jikanPath);
                JsonNode cached = scheduleCache.get(jikanPath);
                long now = System.currentTimeMillis();
                if (cached != null && lastTs != null && (now - lastTs) < SCHEDULE_CACHE_TTL_MS) {
                    if (cached.isArray()) data = (ArrayNode) cached;
                    else if (cached.has("data") && cached.get("data").isArray()) data = (ArrayNode) cached.get("data");
                } else {
                    // If we recently failed, respect cooldown
                    Long lastFail = scheduleFailureTimestamps.getOrDefault(jikanPath, 0L);
                    if ((now - lastFail) < SCHEDULE_FAILURE_COOLDOWN_MS) {
                        System.err.println("⚠️ Recent Jikan failure for " + jikanPath + ", skipping fetch until cooldown expires.");
                    } else {
                        JsonNode resp = null;
                        for (int attempt = 1; attempt <= 4; attempt++) {
                            try {
                                resp = jikanClient.get()
                                        .uri(jikanPath)
                                        .retrieve()
                                        .bodyToMono(JsonNode.class)
                                        .block();
                                if (resp != null) break;
                            } catch (Exception e) {
                                System.err.println("⚠️ Jikan attempt " + attempt + " failed: " + e.getMessage());
                                if (e.getMessage() != null && e.getMessage().contains("429")) {
                                    // record failure timestamp to avoid spamming
                                    scheduleFailureTimestamps.put(jikanPath, System.currentTimeMillis());
                                }
                                try { TimeUnit.MILLISECONDS.sleep(800L * attempt); } catch (InterruptedException ignored) {}
                            }
                        }

                        if (resp != null) {
                            // store in cache
                            scheduleCache.put(jikanPath, resp);
                            scheduleCacheTimestamps.put(jikanPath, System.currentTimeMillis());
                            if (resp.isArray()) {
                                data = (ArrayNode) resp;
                            } else if (resp.has("data") && resp.get("data").isArray()) {
                                data = (ArrayNode) resp.get("data");
                            }
                        } else {
                            System.err.println("❌ Jikan did not return data for path " + jikanPath + " — leaving data empty or use WAT_DEV_SAMPLE to test.");
                            scheduleFailureTimestamps.put(jikanPath, System.currentTimeMillis());
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error while fetching/using schedule cache: " + e.getMessage());
            }
        }

        // Si mode dev activé, remplir un sample pour faciliter le debugging
        if (this.enableDevSample && data.size() == 0) {
            ObjectNode a1 = objectMapper.createObjectNode();
            a1.put("title", "One Piece");
            a1.put("mal_id", 21);
            a1.put("episode", 1054);
            a1.put("air_time", "22:00");
            data.add(a1);

            ObjectNode a2 = objectMapper.createObjectNode();
            a2.put("title", "Spy x Family");
            a2.put("mal_id", 50265);
            a2.put("episode", 12);
            a2.put("air_time", "20:30");
            data.add(a2);

            ObjectNode a3 = objectMapper.createObjectNode();
            a3.put("title", "My Hero Academia");
            a3.put("mal_id", 31964);
            a3.put("episode", 112);
            a3.put("air_time", "18:00");
            data.add(a3);
        }

        out.set("data", data);
        return out;
    }

    @Cacheable(value = "todayReleases", key = "'all_countries'")
    public JsonNode getTodayReleasesAllCountries() {
        System.out.println("🌐 getTodayReleasesAllCountries");
        ObjectNode out = objectMapper.createObjectNode();
        out.put("scope", "all_countries");

        // Countries to query. Keep a focused list to limit rate and keep UX relevance.
        List<String> countries = Arrays.asList("FR", "GB", "US", "JP", "DE", "ES", "IT", "BR", "CA", "AU");

        ArrayNode combined = objectMapper.createArrayNode();
        Set<String> seen = new HashSet<>();

        for (String c : countries) {
            try {
                // Call via proxy so @Cacheable is applied when possible (internal calls bypass proxies)
                JsonNode res = null;
                try {
                    AnimeDataService proxy = applicationContext.getBean(AnimeDataService.class);
                    res = proxy.getTodayReleases(c);
                } catch (Exception e) {
                    // fallback to direct call if proxy resolution fails
                    res = getTodayReleases(c);
                }
                if (res != null && res.has("data") && res.get("data").isArray()) {
                    for (JsonNode item : res.get("data")) {
                        // Build a unique key for deduplication: prefer mal_id, then id, then normalized title
                        String uniq = null;
                        if (item.has("mal_id") && !item.get("mal_id").isNull()) uniq = "mal:" + item.get("mal_id").asText();
                        else if (item.has("id") && !item.get("id").isNull()) uniq = "id:" + item.get("id").asText();
                        else if (item.has("attributes") && item.get("attributes").has("canonicalTitle")) uniq = "title:" + normalizeKey(item.get("attributes").get("canonicalTitle").asText());
                        else if (item.has("title") && !item.get("title").isNull()) uniq = "title:" + normalizeKey(item.get("title").asText());
                        else continue; // can't dedupe reliably

                        if (!seen.contains(uniq)) {
                            // mark source country for debugging/traceability
                            if (item.isObject()) {
                                ((ObjectNode) item).put("source_country", c);
                            }
                            combined.add(item);
                            seen.add(uniq);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ getTodayReleasesAllCountries: failed for " + c + " -> " + e.getMessage());
            }
            // Small delay between country requests to avoid hitting external API rate limits
            try {
                TimeUnit.MILLISECONDS.sleep(WORLDWIDE_REQUEST_DELAY_MS);
            } catch (InterruptedException ignored) {}
        }

        out.set("data", combined);
        out.put("countries_queried", countries.size());
        out.put("total_unique", combined.size());
        return out;
    }

    @Cacheable(value = "weeklyCalendar", key = "#country")
    public JsonNode getWeeklyCalendar(String country) {
        validateCountryOptional(country);
        System.out.println("📅 getWeeklyCalendar pour: " + (country == null ? "null" : country));
        ObjectNode out = objectMapper.createObjectNode();
        out.put("country", country == null ? "" : country.toUpperCase());

        List<String> days = Arrays.asList("sunday","monday","tuesday","wednesday","thursday","friday","saturday");
        ObjectNode week = objectMapper.createObjectNode();

        // If dev sample mode, populate with simple mock entries for each day
        if (this.enableDevSample) {
            for (String d : days) {
                ArrayNode arr = objectMapper.createArrayNode();
                ObjectNode a1 = objectMapper.createObjectNode();
                a1.put("title", "One Piece - " + d);
                a1.put("mal_id", 21);
                a1.put("episode", 1054);
                a1.put("air_time", "22:00");
                a1.put("broadcast_day", d);
                arr.add(a1);

                ObjectNode a2 = objectMapper.createObjectNode();
                a2.put("title", "Spy x Family - " + d);
                a2.put("mal_id", 50265);
                a2.put("episode", 12);
                a2.put("air_time", "20:30");
                a2.put("broadcast_day", d);
                arr.add(a2);

                week.set(d, arr);
            }
            out.set("data", week);
            return out;
        }

        // Production path: fetch schedule per weekday from Jikan with caching & retry
        for (String d : days) {
            String jikanPath = "/schedules/" + d;
            ArrayNode arr = objectMapper.createArrayNode();

            try {
                Long lastTs = scheduleCacheTimestamps.get(jikanPath);
                JsonNode cached = scheduleCache.get(jikanPath);
                long now = System.currentTimeMillis();
                if (cached != null && lastTs != null && (now - lastTs) < SCHEDULE_CACHE_TTL_MS) {
                    if (cached.isArray()) arr = (ArrayNode) cached;
                    else if (cached.has("data") && cached.get("data").isArray()) arr = (ArrayNode) cached.get("data");
                } else {
                    Long lastFail = scheduleFailureTimestamps.getOrDefault(jikanPath, 0L);
                    if ((now - lastFail) < SCHEDULE_FAILURE_COOLDOWN_MS) {
                        System.err.println("⚠️ Recent Jikan failure for " + jikanPath + ", skipping fetch until cooldown expires.");
                    } else {
                        JsonNode resp = null;
                        for (int attempt = 1; attempt <= 4; attempt++) {
                            try {
                                resp = jikanClient.get()
                                        .uri(jikanPath)
                                        .retrieve()
                                        .bodyToMono(JsonNode.class)
                                        .block();
                                if (resp != null) break;
                            } catch (Exception e) {
                                System.err.println("⚠️ Jikan attempt " + attempt + " for " + jikanPath + " failed: " + e.getMessage());
                                if (e.getMessage() != null && e.getMessage().contains("429")) {
                                    scheduleFailureTimestamps.put(jikanPath, System.currentTimeMillis());
                                }
                                try { TimeUnit.MILLISECONDS.sleep(500L * attempt); } catch (InterruptedException ignored) {}
                            }
                        }

                        if (resp != null) {
                            scheduleCache.put(jikanPath, resp);
                            scheduleCacheTimestamps.put(jikanPath, System.currentTimeMillis());
                            if (resp.isArray()) arr = (ArrayNode) resp;
                            else if (resp.has("data") && resp.get("data").isArray()) arr = (ArrayNode) resp.get("data");
                        } else {
                            System.err.println("❌ Jikan did not return data for path " + jikanPath + " — leaving day empty.");
                            scheduleFailureTimestamps.put(jikanPath, System.currentTimeMillis());
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error while fetching schedule for " + jikanPath + ": " + e.getMessage());
            }

            // If a country filter is provided, try to filter the day's schedule to items
            // that are available in that country (by checking providers). This is best-effort
            // and will skip filtering when TMDB API key is missing to avoid extra work.
            try {
                String normalizedCountry = (country == null || country.isBlank()) ? "" : CountryValidator.normalizeCountry(country);
                if (normalizedCountry != null && !normalizedCountry.isBlank() && this.tmdbApiKey != null && !this.tmdbApiKey.isBlank() && arr != null && arr.size() > 0) {
                    ArrayNode filtered = objectMapper.createArrayNode();
                    for (JsonNode item : arr) {
                        try {
                            // Build an anime identifier: prefer mal_id if present, otherwise title
                            String animeIdStr = null;
                            if (item.has("mal_id") && !item.get("mal_id").isNull()) animeIdStr = item.get("mal_id").asText();
                            else if (item.has("id") && !item.get("id").isNull()) animeIdStr = item.get("id").asText();
                            else if (item.has("title") && !item.get("title").isNull()) animeIdStr = item.get("title").asText();
                            else if (item.has("attributes") && item.get("attributes").has("canonicalTitle")) animeIdStr = item.get("attributes").get("canonicalTitle").asText();

                            boolean keep = false;
                            // quick check: if the item was previously marked with source_country (from aggregation), respect it
                            if (item.has("source_country") && !item.get("source_country").isNull()) {
                                String src = item.get("source_country").asText();
                                if (src != null && src.equalsIgnoreCase(normalizedCountry)) keep = true;
                            }

                            if (!keep && animeIdStr != null && !animeIdStr.isBlank()) {
                                // Backoff if recent failures resolving this anime
                                Long lastFail = detailFailureTimestamps.getOrDefault(animeIdStr, 0L);
                                long now = System.currentTimeMillis();
                                if ((now - lastFail) < DETAIL_FAILURE_COOLDOWN_MS) {
                                    // skip checking this anime for now
                                    keep = false;
                                } else {
                                    try {
                                        JsonNode provs = getStreamingPlatforms(animeIdStr, normalizedCountry, "");
                                        if (provs != null && provs.has("data") && provs.get("data").isArray() && provs.get("data").size() > 0) {
                                            keep = true;
                                        }
                                    } catch (Exception e) {
                                        // mark failure to avoid repeated lookups
                                        detailFailureTimestamps.put(animeIdStr, System.currentTimeMillis());
                                    }
                                }
                            }

                            if (keep) filtered.add(item);
                        } catch (Exception e) {
                            // ignore per-item errors
                        }
                    }
                    arr = filtered;
                } else if (normalizedCountry == null || normalizedCountry.isBlank()) {
                    // no country filter -> keep arr as is
                } else if (this.tmdbApiKey == null || this.tmdbApiKey.isBlank()) {
                    System.err.println("ℹ️ TMDB API key missing — skipping country-specific filtering for weekly schedule");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error while applying country filter for day " + d + ": " + e.getMessage());
            }

            week.set(d, arr);

            // small delay between day requests to be gentle with external APIs
            try { TimeUnit.MILLISECONDS.sleep(WORLDWIDE_REQUEST_DELAY_MS); } catch (InterruptedException ignored) {}
        }

        out.set("data", week);
        return out;
    }

    @Cacheable(value = "weeklyCalendar", key = "'all_countries'")
    public JsonNode getWeeklyCalendarAllCountries() {
        System.out.println("📅 getWeeklyCalendarAllCountries");
        ObjectNode out = objectMapper.createObjectNode();
        out.put("scope", "all_countries");
        out.set("data", objectMapper.createObjectNode());
        return out;
    }

    @Cacheable(value = "animeDetails", key = "'platforms_' + #animeId + '_' + #country + '_' + #providedTmdbId")
    public JsonNode getStreamingPlatforms(String animeId, String country, String providedTmdbId) {
        System.out.println("🔎 getStreamingPlatforms animeId=" + safe(animeId) + " country=" + safe(country) + " tmdb=" + safe(providedTmdbId));
        
        // Check internal cache first to avoid repeated processing
        String cacheKey = animeId + "_" + country + "_" + providedTmdbId;
        Long cacheTs = streamingCacheTimestamps.get(cacheKey);
        JsonNode cached = streamingCache.get(cacheKey);
        long now = System.currentTimeMillis();
        
        if (cached != null && cacheTs != null && (now - cacheTs) < STREAMING_CACHE_TTL_MS) {
            return cached;
        }
        
        ObjectNode finalResult = objectMapper.createObjectNode();
        finalResult.put("query_title", "");
        finalResult.put("source", "tmdb");
        ArrayNode providersArr = objectMapper.createArrayNode();

        String normalizedCountry = (country == null || country.isBlank()) ? "" : CountryValidator.normalizeCountry(country);

        // Require TMDB API Key to fetch providers
        if (this.tmdbApiKey == null || this.tmdbApiKey.isBlank()) {
            finalResult.put("source", "stub");
            finalResult.put("error", "TMDB API key missing");
            finalResult.set("data", providersArr);
            return finalResult;
        }

        try {
            String tmdbId = providedTmdbId;
            String mediaType = "tv"; // default assumption for anime

            // If no TMDB id provided, try to resolve title via minimal API calls to avoid rate limiting
            String titleToSearch = null;
            if ((tmdbId == null || tmdbId.isBlank()) && animeId != null && !animeId.isBlank()) {
                try {
                    // OPTIMIZATION: Don't call getTodayReleases here as it creates a cascade of requests
                    // Instead, check if we have cached schedule data first
                    boolean foundInCache = false;
                    for (String day : Arrays.asList("monday","tuesday","wednesday","thursday","friday","saturday","sunday")) {
                        String jikanPath = "/schedules/" + day;
                        JsonNode scheduleDataCached = scheduleCache.get(jikanPath);
                        if (scheduleDataCached != null) {
                            JsonNode dataArray = scheduleDataCached.isArray() ? scheduleDataCached : (scheduleDataCached.has("data") ? scheduleDataCached.get("data") : null);
                            if (dataArray != null && dataArray.isArray()) {
                                for (JsonNode item : dataArray) {
                                    if (item.has("mal_id") && item.get("mal_id").asText().equals(animeId)) {
                                        if (item.has("title")) titleToSearch = item.get("title").asText();
                                        foundInCache = true;
                                        break;
                                    }
                                }
                                if (foundInCache) break;
                            }
                        }
                    }

                    // If not found in cached schedule data, decide next step more carefully:
                    if (titleToSearch == null) {
                        boolean isNumericId = animeId != null && animeId.matches("^\\d+$");
                        if (!isNumericId) {
                            // animeId seems to be a title string — use it directly as search term
                            titleToSearch = animeId;
                        } else {
                            // Only make individual Jikan calls if absolutely necessary and not recently failed
                            // If we recently failed resolving this anime, skip extra attempts to avoid hammering Jikan
                            long currentTime = System.currentTimeMillis();
                            Long lastFail = detailFailureTimestamps.getOrDefault(animeId, 0L);
                            if ((currentTime - lastFail) < DETAIL_FAILURE_COOLDOWN_MS) {
                                System.err.println("⚠️ Recent failure resolving animeId=" + animeId + ", skipping Jikan lookup until cooldown expires.");
                            } else {
                                // RATE LIMITED: Only make ONE attempt with longer retry to avoid 429s
                                try {
                                    Thread.sleep(600); // Wait 600ms before individual anime request
                                    JsonNode jikanResp = jikanClient.get()
                                            .uri(uriBuilder -> uriBuilder.path("/anime/{id}").build(animeId))
                                            .retrieve()
                                            .bodyToMono(JsonNode.class)
                                            .block();
                                    if (jikanResp != null) {
                                        if (jikanResp.has("data")) {
                                            JsonNode attrs = jikanResp.get("data");
                                            if (attrs.has("title_english") && !attrs.get("title_english").isNull()) titleToSearch = attrs.get("title_english").asText();
                                            if ((titleToSearch == null || titleToSearch.isBlank()) && attrs.has("title")) titleToSearch = attrs.get("title").asText();
                                        } else if (jikanResp.has("title")) {
                                            titleToSearch = jikanResp.get("title").asText();
                                        }
                                    }
                                } catch (Exception e) {
                                    System.err.println("⚠️ Jikan fetch for animeId=" + animeId + " failed: " + e.getMessage());
                                    detailFailureTimestamps.put(animeId, System.currentTimeMillis());
                                }
                                if (titleToSearch == null) {
                                    // mark failure to avoid repeated attempts in short time
                                    detailFailureTimestamps.put(animeId, System.currentTimeMillis());
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Title resolution error for animeId=" + animeId + ": " + e.getMessage());
                }
            }

            // If we have a title, search TMDB for best candidate
            if ((tmdbId == null || tmdbId.isBlank()) && titleToSearch != null && !titleToSearch.isBlank()) {
                // create a final copy for use inside lambdas
                final String titleForSearch = titleToSearch;
                JsonNode searchResp = null;
                for (int attempt = 1; attempt <= 2; attempt++) {
                    try {
                        searchResp = tmdbClient.get()
                                .uri(uriBuilder -> uriBuilder.path("/search/multi")
                                        .queryParam("api_key", tmdbApiKey)
                                        .queryParam("query", titleForSearch)
                                        .build())
                                .retrieve()
                                .bodyToMono(JsonNode.class)
                                .block();
                        if (searchResp != null) break;
                    } catch (Exception e) {
                        System.err.println("⚠️ TMDB search attempt " + attempt + " failed: " + e.getMessage());
                        try { TimeUnit.MILLISECONDS.sleep(300L * attempt); } catch (InterruptedException ignored) {}
                    }
                }

                if (searchResp != null && searchResp.has("results") && searchResp.get("results").isArray()) {
                    for (JsonNode r : searchResp.get("results")) {
                        String mt = r.has("media_type") ? r.get("media_type").asText() : "";
                        if (mt.equals("tv") || mt.equals("movie")) {
                            if (r.has("id")) {
                                tmdbId = r.get("id").asText();
                                mediaType = mt;
                                finalResult.put("query_title", titleToSearch);
                                break;
                            }
                        }
                    }
                }
            }

            if (tmdbId != null && !tmdbId.isBlank()) {
                // Query watch/providers endpoint
                String providersPath = "/" + mediaType + "/" + tmdbId + "/watch/providers";
                JsonNode providersResp = null;
                try {
                    providersResp = tmdbClient.get()
                            .uri(uriBuilder -> uriBuilder.path(providersPath).queryParam("api_key", tmdbApiKey).build())
                            .retrieve()
                            .bodyToMono(JsonNode.class)
                            .block();
                } catch (Exception e) {
                    System.err.println("⚠️ TMDB providers fetch failed for " + providersPath + ": " + e.getMessage());
                }

                if (providersResp != null && providersResp.has("results")) {
                    JsonNode countryNode = providersResp.get("results").get(normalizedCountry);
                    if (countryNode != null) {
                        // collect flatrate / buy / rent
                        for (String key : new String[]{"flatrate", "buy", "rent"}) {
                            if (countryNode.has(key) && countryNode.get(key).isArray()) {
                                for (JsonNode p : countryNode.get(key)) {
                                    ObjectNode prov = objectMapper.createObjectNode();
                                    String providerName = p.has("provider_name") ? p.get("provider_name").asText() : (p.has("name") ? p.get("name").asText() : "unknown");
                                    prov.put("provider_name", providerName);
                                    prov.put("type", key);
                                    // provider_id and logo_path if present from TMDB
                                    if (p.has("provider_id")) prov.put("provider_id", p.get("provider_id").asInt());
                                    if (p.has("logo_path") && !p.get("logo_path").isNull()) {
                                        prov.put("logo_path", p.get("logo_path").asText());
                                        // also expose a full URL for convenience (small size)
                                        prov.put("logo_url", "https://image.tmdb.org/t/p/w92" + p.get("logo_path").asText());
                                    }
                                    // normalized name (simple normalisation) to help frontend matching
                                    String normalized = providerName == null ? "" : providerName.toLowerCase().replaceAll("[^a-z0-9+ ]"," ").replaceAll("\\s+"," ").trim();
                                    // canonical normalized name (map common variants to a single canonical key)
                                    String canonical = canonicalProviderName(providerName);
                                    prov.put("normalized_name", canonical == null ? normalized : canonical);
                                    // provider_source: detect if provider is delivered via another platform (e.g. Crunchyroll via Amazon Channels)
                                    if (normalized.contains("amazon") && normalized.contains("crunchy")) {
                                        prov.put("provider_source", "amazon_channel");
                                    }
                                    // leave link empty for now; frontend will build provider-specific links if needed
                                    providersArr.add(prov);
                                }
                            }
                        }
                    } else {
                        System.err.println("ℹ️ No providers for country '" + normalizedCountry + "' in TMDB response");
                    }
                }
            } else {
                System.err.println("❌ Could not resolve TMDB id for animeId=" + animeId + " or title");
            }

        } catch (Exception e) {
            System.err.println("❌ getStreamingPlatforms error: " + e.getMessage());
        }

        // Deduplicate providers by normalized_name (merge sources, types, keep best logo)
        try {
            Map<String, ObjectNode> merged = new LinkedHashMap<>();
            for (JsonNode p : providersArr) {
                String norm = p.has("normalized_name") && !p.get("normalized_name").isNull() ? p.get("normalized_name").asText() : null;
                if (norm == null || norm.isBlank()) {
                    norm = p.has("provider_name") && !p.get("provider_name").isNull() ? p.get("provider_name").asText().toLowerCase().replaceAll("[^a-z0-9+ ]"," ").replaceAll("\\s+"," ").trim() : "unknown";
                }

                ObjectNode current = (ObjectNode) p;
                if (!merged.containsKey(norm)) {
                    // ensure we convert single "type" to an array 'types' for merged representation
                    ObjectNode copy = objectMapper.createObjectNode();
                    copy.put("provider_name", current.has("provider_name") ? current.get("provider_name").asText() : "");
                    if (current.has("provider_id")) copy.put("provider_id", current.get("provider_id").asInt());
                    if (current.has("logo_url")) copy.put("logo_url", current.get("logo_url").asText());
                    copy.put("normalized_name", norm);
                    // types array
                    ArrayNode types = objectMapper.createArrayNode();
                    if (current.has("type")) types.add(current.get("type").asText());
                    copy.set("types", types);
                    // provider_sources array
                    ArrayNode sources = objectMapper.createArrayNode();
                    if (current.has("provider_source")) sources.add(current.get("provider_source").asText());
                    copy.set("provider_sources", sources);
                    merged.put(norm, copy);
                } else {
                    ObjectNode existing = merged.get(norm);
                    // merge provider_id if missing
                    if (!existing.has("provider_id") && current.has("provider_id")) existing.put("provider_id", current.get("provider_id").asInt());
                    // prefer existing logo_url, else set
                    if ((!existing.has("logo_url") || existing.get("logo_url").isNull() || existing.get("logo_url").asText().isBlank()) && current.has("logo_url")) {
                        existing.put("logo_url", current.get("logo_url").asText());
                    }
                    // merge types uniquely
                    ArrayNode existingTypes = (ArrayNode) existing.get("types");
                    String newType = current.has("type") ? current.get("type").asText() : null;
                    boolean found = false;
                    if (newType != null) {
                        for (JsonNode tn : existingTypes) if (tn.asText().equals(newType)) { found = true; break; }
                        if (!found) existingTypes.add(newType);
                    }
                    // merge provider_sources uniquely
                    ArrayNode existingSources = (ArrayNode) existing.get("provider_sources");
                    if (current.has("provider_source")) {
                        String ns = current.get("provider_source").asText();
                        boolean sf = false;
                        for (JsonNode sn : existingSources) if (sn.asText().equals(ns)) { sf = true; break; }
                        if (!sf) existingSources.add(ns);
                    }
                }
            }

            // Build final array preserving priority order: prefer flatrate entries first
            ArrayNode deduped = objectMapper.createArrayNode();
            // First, add entries that have 'flatrate' as one of their types
            for (ObjectNode n : merged.values()) {
                boolean hasFlatrate = false;
                for (JsonNode t : (ArrayNode) n.get("types")) if (t.asText().equals("flatrate")) { hasFlatrate = true; break; }
                if (hasFlatrate) deduped.add(n);
            }
            // Then add the rest
            for (ObjectNode n : merged.values()) {
                boolean hasFlatrate = false;
                for (JsonNode t : (ArrayNode) n.get("types")) if (t.asText().equals("flatrate")) { hasFlatrate = true; break; }
                if (!hasFlatrate) deduped.add(n);
            }

            finalResult.set("data", deduped);
        } catch (Exception e) {
            // on any error, fallback to original array
            System.err.println("❌ Error during provider deduplication: " + e.getMessage());
            finalResult.set("data", providersArr);
        }

        // Cache the result
        streamingCache.put(cacheKey, finalResult);
        streamingCacheTimestamps.put(cacheKey, System.currentTimeMillis());
        
        return finalResult;
    }

    // Debug / resolve stubs
    public JsonNode debugSearchTmdb(String title) {
        validateNonBlank("q", title);
        System.out.println("🔍 debugSearchTmdb q=" + title);
        return searchTmdbForTitle(title);
    }

    public JsonNode debugTmdbProviders(String title, String country) {
        validateNonBlank("q", title);
        System.out.println("🔍 debugTmdbProviders q=" + title + " country=" + safe(country));
        ObjectNode out = objectMapper.createObjectNode();
        out.put("query", title);
        out.put("country", country == null ? "" : country);
        out.set("search", searchTmdbForTitle(title));
        out.set("providers", objectMapper.createObjectNode());
        return out;
    }

    public JsonNode resolveTmdbCandidates(String title, Integer year, String country) {
        validateNonBlank("q", title);
        System.out.println("⚖️ resolveTmdbCandidates q=" + title + " year=" + year + " country=" + safe(country));
        ObjectNode out = objectMapper.createObjectNode();
        out.put("query", title);
        out.put("year", year == null ? -1 : year);
        out.put("country", country == null ? "" : country);
        out.set("topCandidates", objectMapper.createArrayNode());
        return out;
    }

    // ---------------- TMDB helpers (minimal stub) ----------------
    private JsonNode searchTmdbForTitle(String title) {
        if (this.tmdbApiKey == null || this.tmdbApiKey.isBlank()) {
            System.err.println("⚠️ TMDB API key manquante, recherche TMDB non exécutée.");
            return null;
        }
        // Placeholder: implémentation réelle devra appeler tmdbClient avec retry/backoff.
        return null;
    }

    // Map a country code to a reasonable ZoneId
    private ZoneId countryToZoneId(String countryCode) {
        if (countryCode == null) return ZoneId.of("Asia/Tokyo");
        switch (countryCode.toUpperCase()) {
            case "FR": return ZoneId.of("Europe/Paris");
            case "GB": return ZoneId.of("Europe/London");
            case "US": return ZoneId.of("America/New_York");
            case "JP": return ZoneId.of("Asia/Tokyo");
            case "DE": return ZoneId.of("Europe/Berlin");
            case "ES": return ZoneId.of("Europe/Madrid");
            case "IT": return ZoneId.of("Europe/Rome");
            case "BR": return ZoneId.of("America/Sao_Paulo");
            case "CA": return ZoneId.of("America/Toronto");
            case "AU": return ZoneId.of("Australia/Sydney");
            default: return ZoneId.of("Asia/Tokyo");
        }
    }

    // ---------------- Popular platforms & cache stats ----------------

    public Map<String, Object> getPopularPlatformsByRegion(String country) {
        validateCountryOptional(country);
        Map<String, Object> platforms = new HashMap<>();
        String c = country == null ? "" : country.toUpperCase();
        switch (c) {
            case "FR":
            case "FRANCE":
                platforms.put("primary", Arrays.asList("Crunchyroll", "Netflix", "ADN"));
                platforms.put("secondary", Arrays.asList("Wakanim", "Prime Video"));
                break;
            case "US":
            case "USA":
                platforms.put("primary", Arrays.asList("Crunchyroll", "Funimation", "Netflix"));
                platforms.put("secondary", Arrays.asList("Hulu", "Prime Video", "HBO Max"));
                break;
            case "JP":
            case "JAPAN":
                platforms.put("primary", Arrays.asList("Niconico", "AbemaTV", "TVer"));
                platforms.put("secondary", Arrays.asList("Netflix", "Amazon Prime"));
                break;
            default:
                platforms.put("primary", Arrays.asList("Crunchyroll", "Netflix"));
                platforms.put("secondary", Arrays.asList("Prime Video"));
        }
        platforms.put("region", country);
        return platforms;
    }

    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        try {
            var caffeineCacheManager = (org.springframework.cache.caffeine.CaffeineCacheManager) cacheManager;
            var cacheNames = caffeineCacheManager.getCacheNames();
            stats.put("cacheNames", cacheNames);
            stats.put("totalCaches", cacheNames.size());
            Map<String, Object> details = new HashMap<>();
            for (String cacheName : cacheNames) {
                var cache = caffeineCacheManager.getCache(cacheName);
                if (cache != null) {
                    Map<String, Object> cinfo = new HashMap<>();
                    cinfo.put("class", cache.getClass().getSimpleName());
                    details.put(cacheName, cinfo);
                }
            }
            stats.put("cacheDetails", details);
        } catch (Exception e) {
            System.err.println("❌ getCacheStats error: " + e.getMessage());
            stats.put("error", "Impossible de récupérer les stats: " + e.getMessage());
            stats.put("cacheManager", cacheManager == null ? "null" : cacheManager.getClass().getSimpleName());
        }
        return stats;
    }

    /**
     * Retourne le nombre total d'épisodes (sorties) estimés pour le mois courant
     * en sommant les sorties de chaque jour (jusqu'à aujourd'hui) via les schedules Jikan.
     * Cette méthode utilise le cache interne des schedules pour limiter les appels externes.
     */
    public int getMonthlyEpisodesCount(String country) {
        validateCountryOptional(country);
        String normalizedCountry = (country == null || country.isBlank()) ? "" : CountryValidator.normalizeCountry(country);
        ZoneId zone = countryToZoneId(normalizedCountry);
        java.time.LocalDate now = java.time.LocalDate.now(zone);
        java.time.LocalDate start = now.withDayOfMonth(1);
        java.time.LocalDate end = now; // up to today

        int total = 0;
        // To avoid fetching same weekday schedule multiple times, cache locally per call
        Map<String, Integer> weekdayCounts = new HashMap<>();

        for (java.time.LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            String dayName = d.getDayOfWeek().name().toLowerCase();
            if (weekdayCounts.containsKey(dayName)) {
                total += weekdayCounts.get(dayName);
                continue;
            }

            // Fetch schedule array for this weekday using internal cache
            ArrayNode schedule = fetchScheduleArrayForDay(dayName);
            int count = schedule == null ? 0 : schedule.size();
            weekdayCounts.put(dayName, count);
            total += count;
        }

        return total;
    }

    /**
     * Helper: fetch schedule ArrayNode for a given weekday using internal scheduleCache.
     */
    private ArrayNode fetchScheduleArrayForDay(String dayName) {
        if (dayName == null) return objectMapper.createArrayNode();
        String jikanPath = "/schedules/" + dayName;
        try {
            long now = System.currentTimeMillis();
            Long lastTs = scheduleCacheTimestamps.get(jikanPath);
            JsonNode cached = scheduleCache.get(jikanPath);
            if (cached != null && lastTs != null && (now - lastTs) < SCHEDULE_CACHE_TTL_MS) {
                if (cached.isArray()) return (ArrayNode) cached;
                if (cached.has("data") && cached.get("data").isArray()) return (ArrayNode) cached.get("data");
                return objectMapper.createArrayNode();
            }

            Long lastFail = scheduleFailureTimestamps.getOrDefault(jikanPath, 0L);
            if ((now - lastFail) < SCHEDULE_FAILURE_COOLDOWN_MS) {
                // recent failure - avoid fetch
                return objectMapper.createArrayNode();
            }

            JsonNode resp = null;
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    resp = jikanClient.get()
                            .uri(jikanPath)
                            .retrieve()
                            .bodyToMono(JsonNode.class)
                            .block();
                    if (resp != null) break;
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        scheduleFailureTimestamps.put(jikanPath, System.currentTimeMillis());
                    }
                    try { TimeUnit.MILLISECONDS.sleep(600L * attempt); } catch (InterruptedException ignored) {}
                }
            }

            if (resp != null) {
                scheduleCache.put(jikanPath, resp);
                scheduleCacheTimestamps.put(jikanPath, System.currentTimeMillis());
                if (resp.isArray()) return (ArrayNode) resp;
                if (resp.has("data") && resp.get("data").isArray()) return (ArrayNode) resp.get("data");
            }
        } catch (Exception e) {
            System.err.println("⚠️ fetchScheduleArrayForDay error: " + e.getMessage());
        }
        return objectMapper.createArrayNode();
    }

    @Cacheable(value = "globalStats", key = "(#country == null || #country == '') ? 'WORLDWIDE' : #country")
    public Map<String, Object> getGlobalStats(String country) {
        System.out.println("📊 getGlobalStats pour: " + safe(country));
        Map<String, Object> stats = new HashMap<>();
        try {
            int todayReleases = 0;
            boolean dataReliable = true;
            stats.put("todayReleases", todayReleases);
            stats.put("activeWeek", dataReliable ? 50 : 0);
            stats.put("totalEpisodes", dataReliable ? 800 : 0);
            stats.put("totalAnimes", dataReliable ? 1200 : 0);
            stats.put("country", country);
            stats.put("lastUpdated", LocalDate.now().toString());
            stats.put("success", dataReliable);
            stats.put("apiStatus", dataReliable ? "OK" : "LIMITED_DATA");
        } catch (Exception e) {
            System.err.println("❌ Erreur getGlobalStats: " + e.getMessage());
            stats.put("todayReleases", 0);
            stats.put("activeWeek", 0);
            stats.put("totalEpisodes", 0);
            stats.put("totalAnimes", 0);
            stats.put("country", country);
            stats.put("lastUpdated", LocalDate.now().toString());
            stats.put("success", false);
            stats.put("error", e.getMessage());
            stats.put("apiStatus", "ERROR");
        }
        return stats;
    }

    @CacheEvict(value = {"todayReleases", "weeklyCalendar", "animeDetails", "globalStats"}, allEntries = true)
    public void clearCache() {
        System.out.println("🗑️ Tous les caches vidés via Spring Cache");
    }

    // ---------------- Helpers ----------------

    private void validateNonBlank(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Paramètre requis manquant ou vide: " + name);
        }
    }

    private void validateCountryOptional(String country) {
        // Pour l'instant validation minimale; étendre avec CountryValidator si nécessaire
        if (country != null && country.length() > 10) {
            throw new IllegalArgumentException("Code pays invalide: trop long");
        }
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    /**
     * Normalize a string key for deduplication (titles).
     */
    private String normalizeKey(String s) {
        if (s == null) return "";
        return s.toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    /**
     * Fetch anime details by MAL ID from Jikan
     * Used by watchlist to enrich anime cards on new devices
     */
    @Cacheable(value = "animeDetails", key = "#malId")
    public JsonNode getAnimeDetailsByMalId(String malId) {
        System.out.println("🎬 Fetching anime details for MAL ID: " + malId);
        try {
            JsonNode response = jikanClient.get()
                    .uri("/anime/{id}/full", malId)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            
            if (response != null && response.has("data")) {
                JsonNode data = response.get("data");
                // Extract relevant fields for display
                ObjectNode result = objectMapper.createObjectNode();
                result.put("mal_id", data.has("mal_id") ? data.get("mal_id").asInt() : null);
                result.put("title", data.has("title") ? data.get("title").asText() : null);
                result.put("title_english", data.has("title_english") ? data.get("title_english").asText() : null);
                result.put("synopsis", data.has("synopsis") ? data.get("synopsis").asText() : null);
                result.put("score", data.has("score") ? data.get("score").asDouble() : null);
                result.put("year", data.has("year") ? data.get("year").asInt() : null);
                result.put("status", data.has("status") ? data.get("status").asText() : null);
                result.put("episodes", data.has("episodes") ? data.get("episodes").asInt() : null);
                
                // Include images
                if (data.has("images")) {
                    result.set("images", data.get("images"));
                }
                
                // Include broadcast info
                if (data.has("broadcast")) {
                    result.set("broadcast", data.get("broadcast"));
                }
                
                // Include genres
                if (data.has("genres")) {
                    result.set("genres", data.get("genres"));
                }
                
                System.out.println("✅ Retrieved anime details: " + result.get("title").asText());
                return result;
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching anime details for MAL ID " + malId + ": " + e.getMessage());
        }
        return null;
    }

    /**
     * Map raw provider names to a canonical normalized key used by the frontend asset map.
     * Examples: "Crunchyroll (Amazon Channel)" -> "crunchyroll"
     */
    private String canonicalProviderName(String rawName) {
        if (rawName == null) return "";
        String s = rawName.toLowerCase();
        if (s.contains("crunchy")) return "crunchyroll";
        if (s.contains("netflix")) return "netflix";
        if (s.contains("prime") || s.contains("amazon")) return "prime video";
        if (s.contains("disney")) return "disney+";
        if (s.contains("hbo")) return "hbo max";
        if (s.contains("paramount")) return "paramount+";
        if (s.contains("apple")) return "apple tv";
        if (s.contains("funimation")) return "funimation";
        if (s.contains("hulu")) return "hulu";
        if (s.contains("hidive")) return "hidive";
        if (s.contains("anime") && s.contains("digital")) return "adn";
        // fallback: remove punctuation and collapse spaces
        return s.replaceAll("[^a-z0-9+ ]"," ").replaceAll("\\s+"," ").trim();
    }
}