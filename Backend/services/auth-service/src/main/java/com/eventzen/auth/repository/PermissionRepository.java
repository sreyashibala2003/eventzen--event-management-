package com.eventzen.auth.repository;

import com.eventzen.auth.domain.PermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<PermissionEntity, UUID> {
  Optional<PermissionEntity> findByPermissionName(String permissionName);
}