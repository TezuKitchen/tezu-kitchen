package com.tezukitchen.api.auth;

import com.tezukitchen.api.auth.dto.request.LoginRequest;
import com.tezukitchen.api.auth.dto.request.RefreshTokenRequest;
import com.tezukitchen.api.auth.dto.request.RegisterRequest;
import com.tezukitchen.api.auth.dto.response.AuthResponse;
import com.tezukitchen.api.auth.entity.RefreshToken;
import com.tezukitchen.api.auth.repository.RefreshTokenRepository;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.auth.service.AuthServiceImpl;
import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.UnauthorizedException;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthModuleTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private UUID sampleUserId;

    @BeforeEach
    void setUp() {
        sampleUserId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(sampleUserId)
                .name("John Doe")
                .email("john@example.com")
                .phone("1234567890")
                .passwordHash("encodedPassword")
                .role(UserRole.STUDENT)
                .build();
    }

    @Test
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("1234567890")
                .password("password123")
                .role("STUDENT")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateToken(sampleUserId, "john@example.com", "STUDENT")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(sampleUserId)).thenReturn("mock-refresh-token");
        when(jwtService.getJwtRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(3600000L, response.getExpiresIn());
        assertEquals(sampleUserId, response.getUserId());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsBadRequest() {
        RegisterRequest request = RegisterRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("1234567890")
                .password("password123")
                .role("STUDENT")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(sampleUserId, "john@example.com", "STUDENT")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(sampleUserId)).thenReturn("mock-refresh-token");
        when(jwtService.getJwtRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void login_InvalidPassword_ThrowsUnauthorized() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("wrongPassword")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_WithMatchingRole_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .role("STUDENT")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(sampleUserId, "john@example.com", "STUDENT")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(sampleUserId)).thenReturn("mock-refresh-token");
        when(jwtService.getJwtRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void login_WithMismatchedRole_ThrowsUnauthorized() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .role("OWNER")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_WithInvalidRole_ThrowsBadRequest() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .role("INVALID_ROLE")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.login(request));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_Success_RotatesToken() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        RefreshToken existingToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .token("valid-refresh-token")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(existingToken));
        when(jwtService.generateToken(sampleUserId, "john@example.com", "STUDENT")).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(sampleUserId)).thenReturn("new-refresh-token");
        when(jwtService.getJwtRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        assertTrue(existingToken.isRevoked());
        // Verify saved at least twice (once to revoke, once for new token)
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_ExpiredOrRevoked_ThrowsUnauthorized() {
        RefreshTokenRequest request = new RefreshTokenRequest("revoked-token");

        RefreshToken revokedToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .token("revoked-token")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(revokedToken));

        assertThrows(UnauthorizedException.class, () -> authService.refreshToken(request));
    }

    @Test
    void logout_WithSpecificToken_RevokesToken() {
        RefreshTokenRequest request = new RefreshTokenRequest("token-to-revoke");

        RefreshToken token = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .token("token-to-revoke")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("token-to-revoke")).thenReturn(Optional.of(token));

        authService.logout(sampleUserId, request);

        assertTrue(token.isRevoked());
        verify(refreshTokenRepository, times(1)).save(token);
    }

    @Test
    void logout_WithUserId_RevokesAllUserTokens() {
        authService.logout(sampleUserId, null);

        verify(refreshTokenRepository, times(1)).revokeAllByUserId(sampleUserId);
    }
}
