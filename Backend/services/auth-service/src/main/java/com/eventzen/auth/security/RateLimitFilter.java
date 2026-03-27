package com.eventzen.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter for authentication endpoints
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 5; // Maximum attempts per window
    private static final int WINDOW_SIZE_MINUTES = 15; // Time window in minutes

    private final Map<String, AttemptInfo> attemptCache = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        if (!shouldApplyRateLimit(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientId = getClientIdentifier(request);
        cleanupExpiredEntries();

        if (isRateLimited(clientId)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many failed attempts. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);

        if (isFailureStatus(response.getStatus())) {
            recordFailure(clientId);
            return;
        }

        clearAttempts(clientId);
    }

    private boolean shouldApplyRateLimit(String requestURI) {
        return requestURI.contains("/api/v1/auth/login") ||
                requestURI.contains("/api/v1/auth/register");
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Use IP address as client identifier
        // In production, you might want to use a more sophisticated approach
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean isRateLimited(String clientId) {
        AttemptInfo attemptInfo = attemptCache.get(clientId);
        return attemptInfo != null && attemptInfo.attempts >= MAX_ATTEMPTS;
    }

    private void recordFailure(String clientId) {
        LocalDateTime now = LocalDateTime.now();
        AttemptInfo attemptInfo = attemptCache.get(clientId);

        if (attemptInfo == null) {
            attemptCache.put(clientId, new AttemptInfo(1, now));
            return;
        }

        if (attemptInfo.firstAttempt.plusMinutes(WINDOW_SIZE_MINUTES).isBefore(now)) {
            attemptCache.put(clientId, new AttemptInfo(1, now));
            return;
        }

        attemptInfo.attempts++;
    }

    private void clearAttempts(String clientId) {
        attemptCache.remove(clientId);
    }

    private boolean isFailureStatus(int statusCode) {
        return statusCode >= 400;
    }

    public void cleanupExpiredEntries() {
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(WINDOW_SIZE_MINUTES);
        attemptCache.entrySet().removeIf(entry -> entry.getValue().firstAttempt.isBefore(expiryTime));
    }

    private static class AttemptInfo {
        int attempts;
        LocalDateTime firstAttempt;

        AttemptInfo(int attempts, LocalDateTime firstAttempt) {
            this.attempts = attempts;
            this.firstAttempt = firstAttempt;
        }
    }
}
