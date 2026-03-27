package com.eventzen.auth.security;

import com.eventzen.auth.repository.BlacklistedTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final CustomUserDetailsService customUserDetailsService;
  private final BlacklistedTokenRepository blacklistedTokenRepository;

  public JwtAuthenticationFilter(
      JwtService jwtService,
      CustomUserDetailsService customUserDetailsService,
      BlacklistedTokenRepository blacklistedTokenRepository) {
    this.jwtService = jwtService;
    this.customUserDetailsService = customUserDetailsService;
    this.blacklistedTokenRepository = blacklistedTokenRepository;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = header.substring(7);
    try {
      Jwt jwt = jwtService.decode(token);
      String jti = jwt.getId();
      if (jti != null && blacklistedTokenRepository.existsByJti(jti)) {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return;
      }

      String email = jwt.getClaimAsString("email");
      UserPrincipal principal = (UserPrincipal) customUserDetailsService.loadUserByUsername(email);
      UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null,
          principal.getAuthorities());
      SecurityContextHolder.getContext().setAuthentication(auth);
    } catch (JwtException ignored) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    filterChain.doFilter(request, response);
  }
}