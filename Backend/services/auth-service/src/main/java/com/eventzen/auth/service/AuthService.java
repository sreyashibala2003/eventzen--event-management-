package com.eventzen.auth.service;

import com.eventzen.auth.config.AppSecurityProperties;
import com.eventzen.auth.domain.BlacklistedTokenEntity;
import com.eventzen.auth.domain.RefreshTokenEntity;
import com.eventzen.auth.domain.RoleEntity;
import com.eventzen.auth.domain.RoleName;
import com.eventzen.auth.domain.UserEntity;
import com.eventzen.auth.dto.AuthResponse;
import com.eventzen.auth.dto.ChangePasswordRequest;
import com.eventzen.auth.dto.LoginRequest;
import com.eventzen.auth.dto.RegisterRequest;
import com.eventzen.auth.dto.TokenIntrospectionResponse;
import com.eventzen.auth.dto.UpdateMyProfileRequest;
import com.eventzen.auth.dto.UserResponse;
import com.eventzen.auth.exception.AppException;
import com.eventzen.auth.repository.BlacklistedTokenRepository;
import com.eventzen.auth.repository.RefreshTokenRepository;
import com.eventzen.auth.repository.RoleRepository;
import com.eventzen.auth.repository.UserRepository;
import com.eventzen.auth.security.JwtService;
import com.eventzen.auth.security.TokenUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

  private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
  private static final String REFRESH_COOKIE_NAME = "refresh_token";

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final BlacklistedTokenRepository blacklistedTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final TokenUtil tokenUtil;
  private final UserMapper userMapper;
  private final AppSecurityProperties properties;
  private final AccountLockoutService accountLockoutService;

  public AuthService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      RefreshTokenRepository refreshTokenRepository,
      BlacklistedTokenRepository blacklistedTokenRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      TokenUtil tokenUtil,
      UserMapper userMapper,
      AppSecurityProperties properties,
      AccountLockoutService accountLockoutService) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.blacklistedTokenRepository = blacklistedTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.tokenUtil = tokenUtil;
    this.userMapper = userMapper;
    this.properties = properties;
    this.accountLockoutService = accountLockoutService;
  }

  @Transactional
  public UserResponse register(RegisterRequest request) {
    if (userRepository.existsByEmailIgnoreCase(request.email())) {
      throw new AppException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email already exists");
    }

    RoleEntity attendeeRole = roleRepository.findByRoleName(RoleName.ATTENDEE)
        .orElseThrow(
            () -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_NOT_FOUND", "Default role missing"));

    UserEntity user = new UserEntity();
    user.setFirstName(request.firstName().trim());
    user.setLastName(request.lastName().trim());
    user.setEmail(request.email().trim().toLowerCase());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setPhone(request.phone());
    user.getRoles().add(attendeeRole);

    userRepository.save(user);
    return userMapper.toResponse(user);
  }

  @Transactional
  public AuthResponse login(LoginRequest request, HttpServletResponse response, HttpServletRequest httpRequest) {
    String email = request.email().trim().toLowerCase();

    // Check if user exists
    UserEntity user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email)
        .orElse(null);

    if (user != null) {
      // Check if account is locked
      if (accountLockoutService.isAccountLocked(user)) {
        long remainingSeconds = accountLockoutService.getRemainingLockoutTimeSeconds(user);
        throw new AppException(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
            String.format("Account is locked. Try again in %d minutes.", remainingSeconds / 60));
      }
    }

    try {
      Authentication auth = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(email, request.password()));

      if (user == null) {
        // This shouldn't happen if authentication succeeded, but let's be safe
        user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
      }

      if (!user.isActive()) {
        throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "User account is inactive");
      }

      // Record successful login
      if (httpRequest != null) {
        try {
          accountLockoutService.recordLoginAttempt(user, true, null, httpRequest);
        } catch (Exception auditEx) {
          logger.warn("Unable to persist successful login audit for user {}", email, auditEx);
        }
      }

      String accessToken = jwtService.generateAccessToken(user);
      issueRefreshToken(user, response);
      return new AuthResponse(accessToken, "Bearer", jwtService.getAccessTokenTtlSeconds(),
          userMapper.toResponse(user));

    } catch (Exception e) {
      // Record failed login attempt
      if (user != null && httpRequest != null) {
        String failureReason = e.getMessage();
        try {
          accountLockoutService.recordLoginAttempt(user, false, failureReason, httpRequest);
        } catch (Exception auditEx) {
          logger.warn("Unable to persist failed login audit for user {}", email, auditEx);
        }
      }

      // Re-throw the original exception
      throw e;
    }
  }

  @Transactional
  public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
    String token = readRefreshCookie(request);
    if (token == null) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "Refresh token is missing");
    }

    String hash = tokenUtil.sha256(token);
    RefreshTokenEntity refreshToken = refreshTokenRepository.findByTokenHash(hash)
        .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "Refresh token is invalid"));

    if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "Refresh token is expired or revoked");
    }

    UserEntity user = refreshToken.getUser();
    refreshToken.setRevoked(true);
    refreshTokenRepository.save(refreshToken);

    String accessToken = jwtService.generateAccessToken(user);
    issueRefreshToken(user, response);
    return new AuthResponse(accessToken, "Bearer", jwtService.getAccessTokenTtlSeconds(), userMapper.toResponse(user));
  }

  @Transactional
  public void logout(String bearerToken, HttpServletRequest request, HttpServletResponse response) {
    String refreshTokenValue = readRefreshCookie(request);
    if (refreshTokenValue != null) {
      String hash = tokenUtil.sha256(refreshTokenValue);
      refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
      });
    }

    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      String accessToken = bearerToken.substring(7);
      Jwt jwt = jwtService.decode(accessToken);
      if (jwt.getId() != null) {
        BlacklistedTokenEntity blacklisted = new BlacklistedTokenEntity();
        blacklisted.setJti(jwt.getId());
        blacklisted.setExpiresAt(jwt.getExpiresAt());
        blacklistedTokenRepository.save(blacklisted);
      }
    }

    clearRefreshCookie(response);
  }

  @Transactional
  public void changePassword(String email, ChangePasswordRequest request) {
    UserEntity user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
      throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "PASSWORD_REUSE", "New password must be different");
    }

    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);

    // Rotate refresh tokens so all sessions re-authenticate after password change.
    refreshTokenRepository.deleteByUser(user);
  }

  public UserResponse me(String email) {
    UserEntity user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
    return userMapper.toResponse(user);
  }

  @Transactional
  public UserResponse updateMyProfile(String email, UpdateMyProfileRequest request) {
    UserEntity user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

    user.setFirstName(request.firstName().trim());
    user.setLastName(request.lastName().trim());
    user.setPhone(request.phone() == null ? null : request.phone().trim());

    return userMapper.toResponse(userRepository.save(user));
  }

  /**
   * Introspect a JWT token to check its validity and extract claims
   */
  public TokenIntrospectionResponse introspectToken(String token) {
    try {
      Jwt jwt = jwtService.decode(token);
      String jti = jwt.getId();

      // Check if token is blacklisted
      if (jti != null && blacklistedTokenRepository.existsByJti(jti)) {
        return new TokenIntrospectionResponse(false, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null);
      }

      // Check if token is expired
      if (jwt.getExpiresAt() != null && jwt.getExpiresAt().isBefore(Instant.now())) {
        return new TokenIntrospectionResponse(false, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null);
      }

      // Extract claims
      String subject = jwt.getSubject();
      String email = jwt.getClaimAsString("email");
      @SuppressWarnings("unchecked")
      List<String> roles = (List<String>) jwt.getClaim("roles");
      @SuppressWarnings("unchecked")
      List<String> permissions = (List<String>) jwt.getClaim("permissions");
      String name = jwt.getClaimAsString("name");
      String givenName = jwt.getClaimAsString("given_name");
      String familyName = jwt.getClaimAsString("family_name");
      Boolean isActive = jwt.getClaim("active") != null ? (Boolean) jwt.getClaim("active") : null;
      String phone = jwt.getClaimAsString("phone");
      Long authTime = jwt.getClaim("auth_time") != null ? ((Number) jwt.getClaim("auth_time")).longValue() : null;
      Long accountCreated = jwt.getClaim("account_created") != null
          ? ((Number) jwt.getClaim("account_created")).longValue()
          : null;
      Instant expiresAt = jwt.getExpiresAt();
      Instant issuedAt = jwt.getIssuedAt();
      String issuer = jwt.getClaimAsString("iss");

      return new TokenIntrospectionResponse(
          true, subject, email, roles, permissions, name, givenName, familyName,
          isActive, phone, authTime, accountCreated, expiresAt, issuedAt, issuer, jti);

    } catch (Exception e) {
      // Token is invalid
      return new TokenIntrospectionResponse(false, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null);
    }
  }

  private void issueRefreshToken(UserEntity user, HttpServletResponse response) {
    refreshTokenRepository.deleteByUser(user);

    String rawToken = tokenUtil.randomToken();
    RefreshTokenEntity refreshToken = new RefreshTokenEntity();
    refreshToken.setTokenHash(tokenUtil.sha256(rawToken));
    refreshToken.setUser(user);
    refreshToken.setCreatedAt(Instant.now());
    refreshToken.setExpiresAt(Instant.now().plusSeconds(properties.refreshTokenDays() * 86400));
    refreshToken.setRevoked(false);
    refreshTokenRepository.save(refreshToken);

    Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
    cookie.setHttpOnly(true);
    cookie.setSecure(properties.cookieSecure());
    cookie.setPath("/");
    cookie.setMaxAge((int) (properties.refreshTokenDays() * 86400));
    response.addCookie(cookie);
  }

  private String readRefreshCookie(HttpServletRequest request) {
    if (request.getCookies() == null) {
      return null;
    }

    for (Cookie cookie : request.getCookies()) {
      if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
    cookie.setHttpOnly(true);
    cookie.setPath("/");
    cookie.setMaxAge(0);
    response.addCookie(cookie);
  }
}
