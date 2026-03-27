package com.eventzen.auth.controller;

import com.eventzen.auth.dto.AuthResponse;
import com.eventzen.auth.dto.ChangePasswordRequest;
import com.eventzen.auth.dto.LoginRequest;
import com.eventzen.auth.dto.MessageResponse;
import com.eventzen.auth.dto.RegisterRequest;
import com.eventzen.auth.dto.TokenIntrospectionResponse;
import com.eventzen.auth.dto.UpdateMyProfileRequest;
import com.eventzen.auth.dto.UserResponse;
import com.eventzen.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse response) {
    return ResponseEntity.ok(authService.login(request, response, httpRequest));
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
    return ResponseEntity.ok(authService.refresh(request, response));
  }

  @PostMapping("/logout")
  public ResponseEntity<MessageResponse> logout(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      HttpServletRequest request,
      HttpServletResponse response) {
    authService.logout(authorization, request, response);
    return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
  }

  @PostMapping("/change-password")
  public ResponseEntity<MessageResponse> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      Authentication authentication) {
    authService.changePassword(authentication.getName(), request);
    return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Authentication authentication) {
    return ResponseEntity.ok(authService.me(authentication.getName()));
  }

  @PutMapping("/me")
  public ResponseEntity<UserResponse> updateMyProfile(
      @Valid @RequestBody UpdateMyProfileRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(authService.updateMyProfile(authentication.getName(), request));
  }

  @PostMapping("/introspect")
  public ResponseEntity<TokenIntrospectionResponse> introspect(
      @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new IllegalArgumentException("Invalid authorization header");
    }

    String token = authorization.substring(7);
    return ResponseEntity.ok(authService.introspectToken(token));
  }
}
