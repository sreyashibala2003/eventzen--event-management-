package com.eventzen.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record AppSecurityProperties(
    long accessTokenMinutes,
    long refreshTokenDays,
    long resetOtpMinutes,
    boolean cookieSecure,
    String allowedOrigins,
    String jwtPrivateKey,
    String jwtPublicKey) {
}