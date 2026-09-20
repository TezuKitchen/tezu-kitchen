package com.tezukitchen.api.auth.service;

import com.tezukitchen.api.auth.dto.request.LoginRequest;
import com.tezukitchen.api.auth.dto.request.RegisterRequest;
import com.tezukitchen.api.auth.dto.response.AuthResponse;

import com.tezukitchen.api.auth.dto.request.RefreshTokenRequest;

import java.util.UUID;

/**
 * Authentication service.
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(UUID userId, RefreshTokenRequest request);
}
