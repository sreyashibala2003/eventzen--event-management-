package com.eventzen.auth.service;

import com.eventzen.auth.domain.PermissionEntity;
import com.eventzen.auth.domain.RoleEntity;
import com.eventzen.auth.domain.RoleName;
import com.eventzen.auth.domain.UserEntity;
import com.eventzen.auth.repository.PermissionRepository;
import com.eventzen.auth.repository.RoleRepository;
import com.eventzen.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final Environment environment;

  public DataInitializer(
      RoleRepository roleRepository,
      PermissionRepository permissionRepository,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      Environment environment) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.environment = environment;
  }

  @Override
  @Transactional
  public void run(String... args) {
    PermissionEntity manageUsers = createPermission("users.manage", "users", "manage");
    PermissionEntity readUsers = createPermission("users.read", "users", "read");
    PermissionEntity profileManage = createPermission("profile.manage", "profile", "manage");

    EnumMap<RoleName, RoleEntity> roles = new EnumMap<>(RoleName.class);
    for (RoleName roleName : RoleName.values()) {
      RoleEntity role = roleRepository.findByRoleName(roleName).orElseGet(() -> {
        RoleEntity r = new RoleEntity();
        r.setRoleName(roleName);
        r.setDescription(roleName.name() + " role");
        return roleRepository.save(r);
      });
      roles.put(roleName, role);
    }

    roles.get(RoleName.SUPER_ADMIN).getPermissions().addAll(List.of(manageUsers, readUsers, profileManage));
    roles.get(RoleName.ADMIN).getPermissions().addAll(List.of(manageUsers, readUsers, profileManage));
    roles.get(RoleName.ORGANIZER).getPermissions().add(profileManage);
    roles.get(RoleName.STAFF).getPermissions().add(profileManage);
    roles.get(RoleName.ATTENDEE).getPermissions().add(profileManage);
    roleRepository.saveAll(roles.values());

    String adminEmail = environment.getProperty("ADMIN_EMAIL", "admin@eventzen.com");
    String adminPassword = environment.getProperty("ADMIN_PASSWORD", "Admin@12345");

    if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
      UserEntity admin = new UserEntity();
      admin.setFirstName("System");
      admin.setLastName("Admin");
      admin.setEmail(adminEmail);
      admin.setPasswordHash(passwordEncoder.encode(adminPassword));
      admin.setPhone("+1-000-000-0000");
      admin.setActive(true);
      admin.getRoles().add(roles.get(RoleName.ADMIN));
      userRepository.save(admin);
    }
  }

  private PermissionEntity createPermission(String name, String module, String action) {
    return permissionRepository.findByPermissionName(name).orElseGet(() -> {
      PermissionEntity permission = new PermissionEntity();
      permission.setPermissionName(name);
      permission.setModule(module);
      permission.setAction(action);
      return permissionRepository.save(permission);
    });
  }
}