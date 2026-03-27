package com.eventzen.auth.dto;

import java.time.Instant;
import java.util.List;

/**
 * Response for JWT token introspection
 */
public record TokenIntrospectionResponse(
        boolean active,
        String subject,
        String email,
        List<String> roles,
        List<String> permissions,
        String name,
        String givenName,
        String familyName,
        Boolean isActive,
        String phone,
        Long authTime,
        Long accountCreated,
        Instant expiresAt,
        Instant issuedAt,
        String issuer,
        String jti) {
}