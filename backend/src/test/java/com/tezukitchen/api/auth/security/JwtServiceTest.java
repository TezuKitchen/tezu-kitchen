package com.tezukitchen.api.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = Base64.getEncoder().encodeToString(
            "this-is-a-secure-256-bit-secret-key-for-unit-testing!".getBytes()
    );

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpirationMs", 604800000L); // 7 days
        jwtService.init();
    }

    @Test
    @DisplayName("generateToken and extract claims correctly")
    void generateToken_ExtractsClaimsSuccessfully() {
        UUID userId = UUID.randomUUID();
        String email = "student@example.com";
        String role = "STUDENT";

        String token = jwtService.generateToken(userId, email, role);

        assertThat(token).isNotBlank();
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(jwtService.getEmailFromToken(token)).isEqualTo(email);
        assertThat(jwtService.getRoleFromToken(token)).isEqualTo(role);
    }

    @Test
    @DisplayName("generateRefreshToken creates valid token with subject userId")
    void generateRefreshToken_Success() {
        UUID userId = UUID.randomUUID();

        String refreshToken = jwtService.generateRefreshToken(userId);

        assertThat(refreshToken).isNotBlank();
        assertThat(jwtService.validateToken(refreshToken)).isTrue();
        assertThat(jwtService.getUserIdFromToken(refreshToken)).isEqualTo(userId);
    }

    @Test
    @DisplayName("validateToken returns false for malformed token")
    void validateToken_MalformedToken_ReturnsFalse() {
        assertThat(jwtService.validateToken("invalid.token.string")).isFalse();
        assertThat(jwtService.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for expired token")
    void validateToken_ExpiredToken_ReturnsFalse() {
        JwtService shortLivedJwtService = new JwtService();
        ReflectionTestUtils.setField(shortLivedJwtService, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(shortLivedJwtService, "jwtExpirationMs", -1000L); // Already expired
        ReflectionTestUtils.setField(shortLivedJwtService, "jwtRefreshExpirationMs", -1000L);
        shortLivedJwtService.init();

        String expiredToken = shortLivedJwtService.generateToken(UUID.randomUUID(), "exp@test.com", "STUDENT");

        assertThat(shortLivedJwtService.validateToken(expiredToken)).isFalse();
    }
}
