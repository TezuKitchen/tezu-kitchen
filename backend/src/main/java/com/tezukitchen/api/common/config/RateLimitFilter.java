package com.tezukitchen.api.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tezukitchen.api.common.response.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * In-memory per-IP rate limiter for authentication endpoints.
 * <p>
 * Allows a maximum of {@value #MAX_REQUESTS} requests per {@value #WINDOW_MS}ms
 * window per client IP address. Only POST requests to the configured auth paths
 * are rate-limited; all other requests pass through untouched.
 * <p>
 * Uses a simple sliding-window counter backed by {@link ConcurrentHashMap}.
 * Stale entries are cleaned up every 5 minutes to prevent memory leaks.
 * <p>
 * <b>Note:</b> This is suitable for single-instance deployments. For multi-instance
 * deployments, replace with a Redis-backed rate limiter.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /** Maximum requests allowed per window (default 30/min). */
    @org.springframework.beans.factory.annotation.Value("${app.rate-limit.max-requests:30}")
    private int maxRequests = 30;

    /** Window duration in milliseconds (1 minute). */
    private static final long WINDOW_MS = 60_000L;

    /** Auth paths that are rate-limited (POST only). */
    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register"
    );

    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public RateLimitFilter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());

        // Schedule periodic cleanup of stale buckets every 5 minutes
        ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rate-limit-cleaner");
            t.setDaemon(true);
            return t;
        });
        cleaner.scheduleAtFixedRate(this::cleanupStaleBuckets, 5, 5, TimeUnit.MINUTES);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Only rate-limit POST requests to auth endpoints
        if ("POST".equalsIgnoreCase(method) && RATE_LIMITED_PATHS.contains(path)) {
            String clientIp = getClientIp(request);
            RateBucket bucket = buckets.computeIfAbsent(clientIp, k -> new RateBucket());

            if (!bucket.tryConsume(maxRequests)) {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());

                ErrorResponse errorResponse = new ErrorResponse(
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Too many requests. Please try again later.",
                        LocalDateTime.now());

                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the client IP address, respecting the X-Forwarded-For header
     * for deployments behind a reverse proxy.
     */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // Take the first IP (the original client)
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Removes buckets that haven't been used within the last window period
     * to prevent unbounded memory growth.
     */
    private void cleanupStaleBuckets() {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        buckets.entrySet().removeIf(entry -> entry.getValue().getLastRequestTime() < cutoff);
    }

    /**
     * Thread-safe sliding-window rate bucket.
     * Tracks the number of requests within the current time window.
     */
    private static class RateBucket {
        private int count;
        private long windowStart;
        private long lastRequestTime;

        RateBucket() {
            this.count = 0;
            this.windowStart = System.currentTimeMillis();
            this.lastRequestTime = this.windowStart;
        }

        /**
         * Attempts to consume one request token.
         *
         * @return true if the request is allowed, false if rate limit exceeded
         */
        synchronized boolean tryConsume(int maxAllowed) {
            long now = System.currentTimeMillis();
            this.lastRequestTime = now;

            // If the current window has expired, reset
            if (now - windowStart >= WINDOW_MS) {
                windowStart = now;
                count = 0;
            }

            if (count < maxAllowed) {
                count++;
                return true;
            }

            return false;
        }

        synchronized long getLastRequestTime() {
            return lastRequestTime;
        }
    }
}
