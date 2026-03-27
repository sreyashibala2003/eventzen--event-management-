package com.eventzen.auth.service;

import com.eventzen.auth.repository.BlacklistedTokenRepository;
import com.eventzen.auth.repository.LoginAttemptRepository;
import com.eventzen.auth.repository.RefreshTokenRepository;
import com.eventzen.auth.security.RateLimitFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Service for cleaning up expired tokens from the database
 */
@Service
public class TokenCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(TokenCleanupService.class);

    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RateLimitFilter rateLimitFilter;

    public TokenCleanupService(BlacklistedTokenRepository blacklistedTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            LoginAttemptRepository loginAttemptRepository,
            RateLimitFilter rateLimitFilter) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.rateLimitFilter = rateLimitFilter;
    }

    /**
     * Clean up expired blacklisted tokens every hour
     * Since access tokens are short-lived (15 minutes by default), we only need to
     * keep
     * blacklisted tokens until they would naturally expire
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    @Transactional
    public void cleanupExpiredBlacklistedTokens() {
        try {
            Instant now = Instant.now();
            int deletedCount = blacklistedTokenRepository.deleteByExpiresAtBefore(now);

            if (deletedCount > 0) {
                logger.info("Cleaned up {} expired blacklisted tokens", deletedCount);
            }
        } catch (Exception e) {
            logger.error("Error during blacklisted token cleanup", e);
        }
    }

    /**
     * Clean up expired refresh tokens daily
     */
    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        try {
            Instant now = Instant.now();
            int deletedCount = refreshTokenRepository.deleteByExpiresAtBefore(now);

            if (deletedCount > 0) {
                logger.info("Cleaned up {} expired refresh tokens", deletedCount);
            }
        } catch (Exception e) {
            logger.error("Error during refresh token cleanup", e);
        }
    }

    /**
     * Clean up expired rate limit entries every 30 minutes
     */
    @Scheduled(fixedRate = 1800000) // Run every 30 minutes (1800000 ms)
    public void cleanupRateLimitCache() {
        try {
            rateLimitFilter.cleanupExpiredEntries();
            logger.debug("Cleaned up expired rate limit entries");
        } catch (Exception e) {
            logger.error("Error during rate limit cache cleanup", e);
        }
    }

    /**
     * Clean up old login attempts weekly
     * Keep login attempts for 30 days for security auditing
     */
    @Scheduled(cron = "0 0 3 * * SUN") // Run weekly on Sunday at 3 AM
    @Transactional
    public void cleanupOldLoginAttempts() {
        try {
            Instant cutoffTime = Instant.now().minusSeconds(30 * 24 * 3600); // 30 days ago
            int deletedCount = loginAttemptRepository.deleteByAttemptedAtBefore(cutoffTime);

            if (deletedCount > 0) {
                logger.info("Cleaned up {} old login attempts", deletedCount);
            }
        } catch (Exception e) {
            logger.error("Error during login attempts cleanup", e);
        }
    }
}