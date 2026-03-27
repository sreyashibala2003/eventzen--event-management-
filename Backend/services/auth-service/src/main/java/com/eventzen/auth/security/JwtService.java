package com.eventzen.auth.security;

import com.eventzen.auth.config.AppSecurityProperties;
import com.eventzen.auth.domain.UserEntity;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class JwtService {

  private final AppSecurityProperties properties;
  private final RSAKey rsaJwk;
  private final JwtEncoder jwtEncoder;
  private final JwtDecoder jwtDecoder;

  public JwtService(AppSecurityProperties properties) {
    this.properties = properties;
    this.rsaJwk = buildRsaJwk();

    ImmutableJWKSet<SecurityContext> source = new ImmutableJWKSet<>(new JWKSet(rsaJwk));
    this.jwtEncoder = new NimbusJwtEncoder(source);
    try {
      this.jwtDecoder = NimbusJwtDecoder.withPublicKey(rsaJwk.toRSAPublicKey()).build();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to initialize JWT decoder", ex);
    }
  }

  public String generateAccessToken(UserEntity user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(properties.accessTokenMinutes() * 60);
    List<String> roles = user.getRoles().stream().map(role -> role.getRoleName().name()).toList();

    // Extract permissions from roles for fine-grained access control
    Set<String> permissions = user.getRoles().stream()
        .flatMap(role -> role.getPermissions().stream())
        .map(permission -> permission.getPermissionName())
        .collect(java.util.stream.Collectors.toSet());

    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuer("eventzen-auth-service")
        .issuedAt(now)
        .expiresAt(expiresAt)
        .subject(user.getId().toString())
        .id(UUID.randomUUID().toString())
        .claim("email", user.getEmail())
        .claim("roles", roles)
        .claim("permissions", new ArrayList<>(permissions))
        .claim("name", user.getFirstName() + " " + user.getLastName())
        .claim("given_name", user.getFirstName())
        .claim("family_name", user.getLastName())
        .claim("active", user.isActive())
        .claim("phone", user.getPhone())
        .claim("auth_time", now.getEpochSecond())
        .claim("account_created", user.getCreatedAt().getEpochSecond())
        .build();

    return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }

  public Jwt decode(String token) {
    return jwtDecoder.decode(token);
  }

  public long getAccessTokenTtlSeconds() {
    return properties.accessTokenMinutes() * 60;
  }

  public RSAKey getPublicJwk() {
    return rsaJwk.toPublicJWK();
  }

  private RSAKey generateRsa() {
    try {
      KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
      generator.initialize(2048);
      KeyPair pair = generator.generateKeyPair();
      RSAPublicKey publicKey = (RSAPublicKey) pair.getPublic();
      RSAPrivateKey privateKey = (RSAPrivateKey) pair.getPrivate();

      return new RSAKey.Builder(publicKey)
          .privateKey(privateKey)
          .keyID(UUID.randomUUID().toString())
          .build();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to generate RSA keypair", ex);
    }
  }

  private RSAKey buildRsaJwk() {
    String privateKeyB64 = trimToNull(properties.jwtPrivateKey());
    String publicKeyB64 = trimToNull(properties.jwtPublicKey());

    if (privateKeyB64 == null || publicKeyB64 == null) {
      return generateRsa();
    }

    try {
      byte[] privateBytes = Base64.getDecoder().decode(privateKeyB64);
      byte[] publicBytes = Base64.getDecoder().decode(publicKeyB64);

      KeyFactory keyFactory = KeyFactory.getInstance("RSA");
      RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateBytes));
      RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(new X509EncodedKeySpec(publicBytes));

      return new RSAKey.Builder(publicKey)
          .privateKey(privateKey)
          .keyID(UUID.randomUUID().toString())
          .build();
    } catch (Exception ex) {
      throw new IllegalStateException(
          "Invalid JWT key configuration. Ensure JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are base64-encoded PKCS#8/X.509 keys.",
          ex);
    }
  }

  private String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
