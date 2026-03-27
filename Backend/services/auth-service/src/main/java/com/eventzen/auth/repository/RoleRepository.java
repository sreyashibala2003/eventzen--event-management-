package com.eventzen.auth.repository;

import com.eventzen.auth.domain.RoleEntity;
import com.eventzen.auth.domain.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<RoleEntity, UUID> {
  Optional<RoleEntity> findByRoleName(RoleName roleName);
}