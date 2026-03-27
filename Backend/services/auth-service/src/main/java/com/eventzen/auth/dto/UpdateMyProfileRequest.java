package com.eventzen.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateMyProfileRequest(
    @NotBlank @Size(max = 80) String firstName,
    @NotBlank @Size(max = 80) String lastName,
    @Pattern(regexp = "^$|^[+0-9-()\\s]{7,30}$", message = "Phone number is invalid") String phone) {
}