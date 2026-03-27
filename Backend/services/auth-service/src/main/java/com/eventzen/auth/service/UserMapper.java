package com.eventzen.auth.service;

import com.eventzen.auth.domain.UserEntity;
import com.eventzen.auth.dto.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
  public UserResponse toResponse(UserEntity user) {
    return new UserResponse(
        user.getId(),
        user.getFirstName(),
        user.getLastName(),
        user.getEmail(),
        user.getPhone(),
        user.isActive(),
        user.getCreatedAt(),
        user.getRoles().stream().map(role -> role.getRoleName().name()).collect(java.util.stream.Collectors.toSet()));
  }
}