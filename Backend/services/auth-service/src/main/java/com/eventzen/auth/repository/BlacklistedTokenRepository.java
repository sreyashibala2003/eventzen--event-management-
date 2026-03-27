package com.eventzen.auth.repository;

import com.eventzen.auth.domain.BlacklistedTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;

public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedTokenEntity, String> {
  boolean existsByJti(String jti);

  @Modifying
  int deleteByExpiresAtBefore(Instant now);
}