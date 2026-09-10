package com.tezukitchen.api.user;

import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserModuleTests {

    @Test
    @DisplayName("User entity builder constructs user with valid fields")
    void userEntity_BuilderCreatesValidUser() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .name("Alice")
                .email("alice@tezu.ac.in")
                .phone("9876543210")
                .passwordHash("hashed-secret")
                .role(UserRole.STUDENT)
                .build();

        assertThat(user.getId()).isEqualTo(userId);
        assertThat(user.getName()).isEqualTo("Alice");
        assertThat(user.getEmail()).isEqualTo("alice@tezu.ac.in");
        assertThat(user.getPhone()).isEqualTo("9876543210");
        assertThat(user.getPasswordHash()).isEqualTo("hashed-secret");
        assertThat(user.getRole()).isEqualTo(UserRole.STUDENT);
    }

    @Test
    @DisplayName("User prePersist sets createdAt if null")
    void userEntity_PrePersistSetsCreatedAt() {
        User user = User.builder()
                .name("Bob")
                .email("bob@tezu.ac.in")
                .phone("9876543211")
                .passwordHash("hashed-secret")
                .role(UserRole.OWNER)
                .build();

        assertThat(user.getCreatedAt()).isNull();

        // Simulate JPA lifecycle hook
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(user, "onCreate");

        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getCreatedAt()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    @DisplayName("User prePersist preserves existing createdAt if already populated")
    void userEntity_PrePersistPreservesExistingCreatedAt() {
        Instant existingTime = Instant.now().minusSeconds(3600);
        User user = User.builder()
                .name("Charlie")
                .email("charlie@tezu.ac.in")
                .phone("9876543212")
                .passwordHash("hashed-secret")
                .role(UserRole.ADMIN)
                .createdAt(existingTime)
                .build();

        org.springframework.test.util.ReflectionTestUtils.invokeMethod(user, "onCreate");

        assertThat(user.getCreatedAt()).isEqualTo(existingTime);
    }
}
