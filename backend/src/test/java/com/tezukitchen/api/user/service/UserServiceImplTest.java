package com.tezukitchen.api.user.service;

import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID userId;
    private UUID otherUserId;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();

        sampleUser = User.builder()
                .id(userId)
                .name("Jane Doe")
                .email("jane@example.com")
                .phone("9876543210")
                .passwordHash("hashed-password")
                .role(UserRole.STUDENT)
                .createdAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserByIdTests {

        @Test
        @DisplayName("returns UserResponse when user exists")
        void getUserById_Success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            UserResponse response = userService.getUserById(userId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(userId);
            assertThat(response.getName()).isEqualTo("Jane Doe");
            assertThat(response.getEmail()).isEqualTo("jane@example.com");
            assertThat(response.getRole()).isEqualTo("STUDENT");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user does not exist")
        void getUserById_NotFound_ThrowsException() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserById(userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id");
        }
    }

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsersTests {

        @Test
        @DisplayName("returns paginated users")
        void getAllUsers_Success() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(sampleUser), pageable, 1);

            when(userRepository.findAll(pageable)).thenReturn(userPage);

            Page<UserResponse> result = userService.getAllUsers(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getEmail()).isEqualTo("jane@example.com");
        }
    }

    @Nested
    @DisplayName("updateUser")
    class UpdateUserTests {

        @Test
        @DisplayName("updates user profile when user updates their own profile")
        void updateUser_OwnProfile_Success() {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("Jane Updated")
                    .phone("1122334455")
                    .build();

            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UserResponse response = userService.updateUser(userId, userId, request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Jane Updated");
            assertThat(response.getPhone()).isEqualTo("1122334455");
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("throws ForbiddenException when attempting to update another user's profile")
        void updateUser_OtherUser_ThrowsForbidden() {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("Jane Updated")
                    .phone("1122334455")
                    .build();

            assertThatThrownBy(() -> userService.updateUser(userId, otherUserId, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You can only update your own profile");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user profile does not exist in DB")
        void updateUser_UserNotFound_ThrowsException() {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("Jane Updated")
                    .phone("1122334455")
                    .build();

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(userId, userId, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteUser")
    class DeleteUserTests {

        @Test
        @DisplayName("deletes user when deleting own account")
        void deleteUser_OwnAccount_Success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            userService.deleteUser(userId, userId);

            verify(userRepository).delete(sampleUser);
        }

        @Test
        @DisplayName("throws ForbiddenException when deleting another user's account")
        void deleteUser_OtherUser_ThrowsForbidden() {
            assertThatThrownBy(() -> userService.deleteUser(userId, otherUserId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You can only delete your own account");

            verify(userRepository, never()).delete(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user does not exist")
        void deleteUser_NotFound_ThrowsException() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deleteUser(userId, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
