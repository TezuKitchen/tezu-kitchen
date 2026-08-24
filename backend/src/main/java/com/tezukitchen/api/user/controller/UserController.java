package com.tezukitchen.api.user.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * User management REST controller.
 * <p>
 * Planned endpoints:
 * - GET    /api/v1/users/me — Get current user profile
 * - PUT    /api/v1/users/me — Update current user profile
 * - GET    /api/v1/users/{id} — Get user by ID (admin)
 * - GET    /api/v1/users — List users (admin)
 * - DELETE /api/v1/users/{id} — Delete user (admin)
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    // TODO: Inject UserService
    // TODO: Implement user management endpoints
}
