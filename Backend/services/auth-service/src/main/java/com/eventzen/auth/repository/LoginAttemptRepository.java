package com.eventzen.auth.repository;

import com.eventzen.auth.domain.LoginAttemptEntity;
import com.eventzen.auth.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LoginAttemptRepository extends JpaRepository<LoginAttemptEntity, UUID> {

    @Query("SELECT la FROM LoginAttemptEntity la WHERE la.user = :user AND la.attemptedAt >= :since ORDER BY la.attemptedAt DESC")
    List<LoginAttemptEntity> findRecentAttemptsByUser(UserEntity user, Instant since);

    @Query("SELECT COUNT(la) FROM LoginAttemptEntity la WHERE la.user = :user AND la.successful = false AND la.attemptedAt >= :since")
    int countFailedAttemptsForUserSince(UserEntity user, Instant since);

    @Modifying
    int deleteByAttemptedAtBefore(Instant cutoffTime);
}