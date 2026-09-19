package com.tezukitchen.api.user.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.user.dto.request.UpdatePushTokenRequest;
import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import com.tezukitchen.api.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(Pageable pageable) {
        Page<UserResponse> response = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        UserResponse response = userService.updateUser(authenticatedUserId, id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        UserResponse response = userService.updateUser(authenticatedUserId, authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        userService.deleteUser(authenticatedUserId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/push-token")
    public ResponseEntity<ApiResponse<Void>> updatePushToken(
            @Valid @RequestBody UpdatePushTokenRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        userService.updatePushToken(authenticatedUserId, request.getExpoPushToken());
        return ResponseEntity.ok(ApiResponse.success("Push token updated successfully", null));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
