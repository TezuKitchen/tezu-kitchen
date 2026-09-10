package com.tezukitchen.api.user.service;

import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {
    UserResponse getUserById(UUID id);
    UserResponse updateUser(UUID authenticatedUserId, UUID targetUserId, UpdateUserRequest request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    void deleteUser(UUID authenticatedUserId, UUID targetUserId);
    void updatePushToken(UUID userId, String pushToken);
}
