package com.tezukitchen.api.user.service;

import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.user.dto.request.ChangePasswordRequest;
import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        user.setAvatarUrl(request.getAvatarUrl());
        if (request.getSavedAddresses() != null) {
            user.setSavedAddresses(request.getSavedAddresses());
        }
        if (request.getExpoPushToken() != null) {
            user.setExpoPushToken(request.getExpoPushToken());
        }
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
    public void updatePushToken(UUID userId, String expoPushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setExpoPushToken(expoPushToken);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .avatarUrl(user.getAvatarUrl())
                .savedAddresses(user.getSavedAddresses())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
