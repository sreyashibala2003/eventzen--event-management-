package com.eventzen.auth.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
    UUID userId,
    String firstName,
    String lastName,
    String email,
    String phone,
    boolean isActive,
    Instant createdAt,
    Set<String> roles) {
}