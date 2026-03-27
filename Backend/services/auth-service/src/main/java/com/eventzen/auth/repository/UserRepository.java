package com.eventzen.auth.repository;

import com.eventzen.auth.domain.UserEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
  Optional<UserEntity> findByEmailIgnoreCaseAndIsDeletedFalse(String email);

  @EntityGraph(attributePaths = { "roles", "roles.permissions" })
  Optional<UserEntity> findWithRolesAndPermissionsByEmailIgnoreCaseAndIsDeletedFalse(String email);

  boolean existsByEmailIgnoreCase(String email);
}
