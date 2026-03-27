package com.eventzen.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "permissions")
public class PermissionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "permission_id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "permission_name", nullable = false, unique = true, length = 100)
  private String permissionName;

  @Column(nullable = false, length = 60)
  private String module;

  @Column(nullable = false, length = 40)
  private String action;

  public UUID getId() {
    return id;
  }

  public String getPermissionName() {
    return permissionName;
  }

  public void setPermissionName(String permissionName) {
    this.permissionName = permissionName;
  }

  public String getModule() {
    return module;
  }

  public void setModule(String module) {
    this.module = module;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }
}