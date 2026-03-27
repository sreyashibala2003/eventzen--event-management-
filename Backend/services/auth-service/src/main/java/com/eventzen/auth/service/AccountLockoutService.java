package com.eventzen.auth.service;

import com.eventzen.auth.config.AppSecurityProperties;
import com.eventzen.auth.domain.LoginAttemptEntity;
import com.eventzen.auth.domain.UserEntity;
import com.eventzen.auth.repository.LoginAttemptRepository;
import com.eventzen.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Service for managing account lockout functionality
 */
@Service
public class AccountLockoutService {

    private static final Logger logger = LoggerFactory.getLogger(AccountLockoutService.class);

    private static final int MAX_FAILED_ATTEMPTS = 5; // Maximum failed attempts before lockout
    private static final int LOCKOUT_DURATION_MINUTES = 30; // Lockout duration in minutes
    private static final int ATTEMPT_WINDOW_MINUTES = 15; // Time window for counting failed attempts

    private final LoginAttemptRepository loginAttemptRepository;
    private final UserRepository userRepository;

    public AccountLockoutService(LoginAttemptRepository loginAttemptRepository,
            UserRepository userRepository) {
        this.loginAttemptRepository = loginAttemptRepository;
        this.userRepository = userRepository;
    }

    /**
     * Check if a user account is currently locked
     */
    public boolean isAccountLocked(UserEntity user) {
        if (!user.isLocked()) {
            return false;
        }

        // Check if lockout period has expired
        if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(Instant.now())) {
            unlockAccount(user);
            return false;
        }

        return true;
    }

    /**
     * Record a login attempt and handle account lockout logic
     */
    @Transactional
    public void recordLoginAttempt(UserEntity user, boolean successful, String failureReason,
            HttpServletRequest request) {
        // Create login attempt record
        LoginAttemptEntity attempt = new LoginAttemptEntity();
        attempt.setUser(user);
        attempt.setSuccessful(successful);
        attempt.setFailureReason(failureReason);
        attempt.setIpAddress(getClientIpAddress(request));
        attempt.setUserAgent(request.getHeader("User-Agent"));

        loginAttemptRepository.save(attempt);

        if (successful) {
            // Reset failed attempts on successful login
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLastFailedLogin(null);
                userRepository.save(user);
                logger.info("Reset failed login attempts for user: {}", user.getEmail());
            }
        } else {
            handleFailedAttempt(user);
        }
    }

    /**
     * Handle failed login attempt and potentially lock account
     */
    @Transactional
    public void handleFailedAttempt(UserEntity user) {
        Instant windowStart = Instant.now().minusSeconds(ATTEMPT_WINDOW_MINUTES * 60);
        int recentFailedAttempts = loginAttemptRepository.countFailedAttemptsForUserSince(user, windowStart);

        user.setFailedLoginAttempts(recentFailedAttempts);
        user.setLastFailedLogin(Instant.now());

        if (recentFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            lockAccount(user);
            logger.warn("Account locked for user: {} after {} failed attempts", user.getEmail(), recentFailedAttempts);
        } else {
            logger.info("Failed login attempt for user: {} ({}/{} attempts)",
                    user.getEmail(), recentFailedAttempts, MAX_FAILED_ATTEMPTS);
        }

        userRepository.save(user);
    }

    /**
     * Lock user account
     */
    @Transactional
    public void lockAccount(UserEntity user) {
        user.setLocked(true);
        user.setLockedUntil(Instant.now().plusSeconds(LOCKOUT_DURATION_MINUTES * 60));
        userRepository.save(user);
        logger.warn("Account locked for user: {} until {}", user.getEmail(), user.getLockedUntil());
    }

    /**
     * Unlock user account
     */
    @Transactional
    public void unlockAccount(UserEntity user) {
        user.setLocked(false);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        user.setLastFailedLogin(null);
        userRepository.save(user);
        logger.info("Account unlocked for user: {}", user.getEmail());
    }

    /**
     * Get remaining lockout time in seconds
     */
    public long getRemainingLockoutTimeSeconds(UserEntity user) {
        if (!user.isLocked() || user.getLockedUntil() == null) {
            return 0;
        }

        long remaining = user.getLockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}