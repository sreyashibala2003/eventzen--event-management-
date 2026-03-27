package com.eventzen.auth.repository;

import com.eventzen.auth.domain.RefreshTokenEntity;
import com.eventzen.auth.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, UUID> {
  Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

  @Modifying
  void deleteByUser(UserEntity user);

  @Modifying
  int deleteByExpiresAtBefore(Instant now);
}