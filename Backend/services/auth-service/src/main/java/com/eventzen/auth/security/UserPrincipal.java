package com.eventzen.auth.security;

import com.eventzen.auth.domain.RoleEntity;
import com.eventzen.auth.domain.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class UserPrincipal implements UserDetails {
  private final UUID userId;
  private final String email;
  private final String password;
  private final boolean active;
  private final Set<GrantedAuthority> authorities;

  public UserPrincipal(UserEntity user) {
    this.userId = user.getId();
    this.email = user.getEmail();
    this.password = user.getPasswordHash();
    this.active = user.isActive() && !user.isDeleted();
    this.authorities = new HashSet<>();

    for (RoleEntity role : user.getRoles()) {
      this.authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName().name()));
      role.getPermissions()
          .forEach(permission -> this.authorities.add(new SimpleGrantedAuthority(permission.getPermissionName())));
    }
  }

  public UUID getUserId() {
    return userId;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return password;
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return active;
  }
}