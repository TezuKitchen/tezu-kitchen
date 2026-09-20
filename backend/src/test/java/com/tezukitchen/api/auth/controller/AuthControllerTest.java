package com.tezukitchen.api.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.dto.request.LoginRequest;
import com.tezukitchen.api.auth.dto.request.RefreshTokenRequest;
import com.tezukitchen.api.auth.dto.request.RegisterRequest;
import com.tezukitchen.api.auth.dto.response.AuthResponse;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.auth.service.AuthService;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID sampleUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class RegisterTests {

        @Test
        @DisplayName("returns 201 when registration is successful")
        void register_Success() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Alice")
                    .email("alice@example.com")
                    .phone("9876543210")
                    .password("Password123")
                    .role("STUDENT")
                    .build();

            AuthResponse response = AuthResponse.builder()
                    .accessToken("mock-jwt-token")
                    .refreshToken("mock-refresh-token")
                    .tokenType("Bearer")
                    .expiresIn(3600000L)
                    .userId(sampleUserId)
                    .name("Alice")
                    .email("alice@example.com")
                    .role("STUDENT")
                    .build();

            when(authService.register(any(RegisterRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("User registered successfully"))
                    .andExpect(jsonPath("$.data.accessToken").value("mock-jwt-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("mock-refresh-token"))
                    .andExpect(jsonPath("$.data.userId").value(sampleUserId.toString()));
        }

        @Test
        @DisplayName("returns 400 when required fields are missing")
        void register_MissingFields_Returns400() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .name("")
                    .email("")
                    .phone("")
                    .password("")
                    .build();

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.errors", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("returns 400 when email already exists")
        void register_EmailConflict_Returns400() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Alice")
                    .email("existing@example.com")
                    .phone("9876543210")
                    .password("Password123")
                    .role("STUDENT")
                    .build();

            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new BadRequestException("Email is already registered"));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Email is already registered"));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class LoginTests {

        @Test
        @DisplayName("returns 200 when login credentials are valid")
        void login_Success() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("alice@example.com")
                    .password("Password123")
                    .build();

            AuthResponse response = AuthResponse.builder()
                    .accessToken("mock-jwt-token")
                    .refreshToken("mock-refresh-token")
                    .tokenType("Bearer")
                    .expiresIn(3600000L)
                    .userId(sampleUserId)
                    .name("Alice")
                    .email("alice@example.com")
                    .role("STUDENT")
                    .build();

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.accessToken").value("mock-jwt-token"))
                    .andExpect(jsonPath("$.data.userId").value(sampleUserId.toString()));
        }

        @Test
        @DisplayName("returns 401 when credentials are wrong")
        void login_InvalidCredentials_Returns401() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("alice@example.com")
                    .password("WrongPassword")
                    .build();

            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new UnauthorizedException("Invalid email or password"));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        @DisplayName("returns 400 when body is invalid")
        void login_InvalidBody_Returns400() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("not-an-email")
                    .password("")
                    .build();

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/refresh")
    class RefreshTests {

        @Test
        @DisplayName("returns 200 with rotated tokens when valid refresh token is supplied")
        void refresh_Success() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

            AuthResponse response = AuthResponse.builder()
                    .accessToken("new-access-token")
                    .refreshToken("new-refresh-token")
                    .tokenType("Bearer")
                    .expiresIn(3600000L)
                    .userId(sampleUserId)
                    .name("Alice")
                    .email("alice@example.com")
                    .role("STUDENT")
                    .build();

            when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"));
        }

        @Test
        @DisplayName("returns 401 when refresh token is expired or revoked")
        void refresh_InvalidToken_Returns401() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("revoked-token");

            when(authService.refreshToken(any(RefreshTokenRequest.class)))
                    .thenThrow(new UnauthorizedException("Invalid or expired refresh token"));

            mockMvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/logout")
    class LogoutTests {

        @Test
        @DisplayName("returns 200 when authenticated user logs out")
        void logout_Authenticated_Success() throws Exception {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(sampleUserId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
            );

            RefreshTokenRequest request = new RefreshTokenRequest("some-refresh-token");

            mockMvc.perform(post("/api/v1/auth/logout")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged out successfully"));

            verify(authService).logout(eq(sampleUserId), any(RefreshTokenRequest.class));
        }

        @Test
        @DisplayName("returns 200 when logout is called without request body")
        void logout_NoBody_Success() throws Exception {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(sampleUserId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
            );

            mockMvc.perform(post("/api/v1/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged out successfully"));

            verify(authService).logout(eq(sampleUserId), isNull());
        }
    }
}
