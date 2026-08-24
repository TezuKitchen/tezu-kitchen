package com.tezukitchen.api.auth.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication REST controller.
 * <p>
 * Planned endpoints:
 * - POST /api/v1/auth/register — User registration
 * - POST /api/v1/auth/login — User login
 * - POST /api/v1/auth/refresh — Refresh JWT token
 * - POST /api/v1/auth/logout — User logout
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    // TODO: Inject AuthService
    // TODO: Implement authentication endpoints
}
