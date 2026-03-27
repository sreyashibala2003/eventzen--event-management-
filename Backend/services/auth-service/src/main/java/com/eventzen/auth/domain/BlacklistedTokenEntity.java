package com.eventzen.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "blacklisted_tokens")
public class BlacklistedTokenEntity {

  @Id
  @Column(name = "jti", nullable = false, updatable = false, length = 120)
  private String jti;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  public String getJti() {
    return jti;
  }

  public void setJti(String jti) {
    this.jti = jti;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }
}