package com.tezukitchen.api.auth.service;

import com.tezukitchen.api.auth.dto.request.LoginRequest;
import com.tezukitchen.api.auth.dto.request.RefreshTokenRequest;
import com.tezukitchen.api.auth.dto.request.RegisterRequest;
import com.tezukitchen.api.auth.dto.response.AuthResponse;
import com.tezukitchen.api.auth.entity.RefreshToken;
import com.tezukitchen.api.auth.repository.RefreshTokenRepository;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.UnauthorizedException;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpirationMs())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpirationMs())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        // Token rotation: revoke previous refresh token and create a new one
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpirationMs())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public void logout(UUID userId, RefreshTokenRequest request) {
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenRepository.findByToken(request.getRefreshToken())
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        } else if (userId != null) {
            refreshTokenRepository.revokeAllByUserId(userId);
        }
    }

    private String createAndSaveRefreshToken(User user) {
        String refreshTokenString = jwtService.generateRefreshToken(user.getId());
        Instant expiresAt = Instant.now().plusMillis(jwtService.getJwtRefreshExpirationMs());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenString)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return refreshTokenString;
    }
}
