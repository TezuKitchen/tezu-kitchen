package com.tezukitchen.api.user.service;

import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(UUID authenticatedUserId, UUID targetUserId, UpdateUserRequest request) {
        if (!authenticatedUserId.equals(targetUserId)) {
            throw new ForbiddenException("You can only update your own profile");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);
        return mapToResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteUser(UUID authenticatedUserId, UUID targetUserId) {
        if (!authenticatedUserId.equals(targetUserId)) {
            throw new ForbiddenException("You can only delete your own account");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void updatePushToken(UUID userId, String pushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setPushToken(pushToken);
        userRepository.save(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
