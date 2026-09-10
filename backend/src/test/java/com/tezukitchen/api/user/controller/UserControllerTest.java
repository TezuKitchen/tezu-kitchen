package com.tezukitchen.api.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.user.dto.request.UpdateUserRequest;
import com.tezukitchen.api.user.dto.response.UserResponse;
import com.tezukitchen.api.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID authenticatedUserId = UUID.randomUUID();
    private final UUID targetUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(authenticatedUserId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
        );
    }

    @Nested
    @DisplayName("GET /api/v1/users/{id}")
    class GetUserByIdTests {

        @Test
        @DisplayName("returns 200 and UserResponse when user exists")
        void getUserById_Success() throws Exception {
            UserResponse response = UserResponse.builder()
                    .id(targetUserId)
                    .name("Alice")
                    .email("alice@example.com")
                    .phone("9876543210")
                    .role("STUDENT")
                    .createdAt(Instant.now())
                    .build();

            when(userService.getUserById(targetUserId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/users/{id}", targetUserId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(targetUserId.toString()))
                    .andExpect(jsonPath("$.data.email").value("alice@example.com"));
        }

        @Test
        @DisplayName("returns 404 when user is not found")
        void getUserById_NotFound_Returns404() throws Exception {
            when(userService.getUserById(targetUserId))
                    .thenThrow(new ResourceNotFoundException("User", "id", targetUserId));

            mockMvc.perform(get("/api/v1/users/{id}", targetUserId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/users")
    class GetAllUsersTests {

        @Test
        @DisplayName("returns 200 with paginated users")
        void getAllUsers_Success() throws Exception {
            UserResponse response = UserResponse.builder()
                    .id(targetUserId)
                    .name("Alice")
                    .email("alice@example.com")
                    .phone("9876543210")
                    .role("STUDENT")
                    .build();

            Page<UserResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1);
            when(userService.getAllUsers(any(Pageable.class))).thenReturn(page);

            mockMvc.perform(get("/api/v1/users"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].email").value("alice@example.com"));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/users/{id}")
    class UpdateUserTests {

        @Test
        @DisplayName("returns 200 when update is successful")
        void updateUser_Success() throws Exception {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("Alice Updated")
                    .phone("1234567890")
                    .build();

            UserResponse response = UserResponse.builder()
                    .id(authenticatedUserId)
                    .name("Alice Updated")
                    .email("alice@example.com")
                    .phone("1234567890")
                    .role("STUDENT")
                    .build();

            when(userService.updateUser(eq(authenticatedUserId), eq(authenticatedUserId), any(UpdateUserRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/v1/users/{id}", authenticatedUserId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Alice Updated"));
        }

        @Test
        @DisplayName("returns 400 when validation fails on blank fields")
        void updateUser_ValidationFailure_Returns400() throws Exception {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("")
                    .phone("")
                    .build();

            mockMvc.perform(put("/api/v1/users/{id}", authenticatedUserId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }

        @Test
        @DisplayName("returns 403 when updating another user's profile")
        void updateUser_Forbidden_Returns403() throws Exception {
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .name("Bob")
                    .phone("1234567890")
                    .build();

            when(userService.updateUser(eq(authenticatedUserId), eq(targetUserId), any(UpdateUserRequest.class)))
                    .thenThrow(new ForbiddenException("You can only update your own profile"));

            mockMvc.perform(put("/api/v1/users/{id}", targetUserId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.message").value("You can only update your own profile"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/users/{id}")
    class DeleteUserTests {

        @Test
        @DisplayName("returns 204 when user is deleted successfully")
        void deleteUser_Success() throws Exception {
            doNothing().when(userService).deleteUser(authenticatedUserId, authenticatedUserId);

            mockMvc.perform(delete("/api/v1/users/{id}", authenticatedUserId))
                    .andExpect(status().isNoContent());

            verify(userService).deleteUser(authenticatedUserId, authenticatedUserId);
        }

        @Test
        @DisplayName("returns 403 when deleting another user's account")
        void deleteUser_Forbidden_Returns403() throws Exception {
            doThrow(new ForbiddenException("You can only delete your own account"))
                    .when(userService).deleteUser(authenticatedUserId, targetUserId);

            mockMvc.perform(delete("/api/v1/users/{id}", targetUserId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("returns 404 when user to delete is not found")
        void deleteUser_NotFound_Returns404() throws Exception {
            doThrow(new ResourceNotFoundException("User", "id", authenticatedUserId))
                    .when(userService).deleteUser(authenticatedUserId, authenticatedUserId);

            mockMvc.perform(delete("/api/v1/users/{id}", authenticatedUserId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }
}
