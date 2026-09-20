package com.tezukitchen.api.restaurant;

import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RestaurantModuleTests {

    @Test
    @DisplayName("Restaurant builder defaults isOpen to true")
    void restaurantEntity_DefaultsIsOpenToTrue() {
        Restaurant restaurant = Restaurant.builder()
                .name("Campus Kitchen")
                .location("SAC")
                .build();

        assertThat(restaurant.isOpen()).isTrue();
    }

    @Test
    @DisplayName("Restaurant entity retains owner association and properties")
    void restaurantEntity_RetainsOwnerAndProperties() {
        UUID ownerId = UUID.randomUUID();
        User owner = User.builder()
                .id(ownerId)
                .name("Chef Owner")
                .email("chef@tezu.ac.in")
                .role(UserRole.OWNER)
                .build();

        Restaurant restaurant = Restaurant.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .name("Campus Cafe")
                .description("Snacks and beverages")
                .location("Student Activity Center")
                .isOpen(false)
                .build();

        assertThat(restaurant.getOwner()).isSameAs(owner);
        assertThat(restaurant.getOwner().getId()).isEqualTo(ownerId);
        assertThat(restaurant.getName()).isEqualTo("Campus Cafe");
        assertThat(restaurant.isOpen()).isFalse();
    }

    @Test
    @DisplayName("Restaurant prePersist sets createdAt timestamp when missing")
    void restaurantEntity_PrePersistSetsCreatedAt() {
        Restaurant restaurant = Restaurant.builder()
                .name("Dhaba")
                .location("North Gate")
                .build();

        assertThat(restaurant.getCreatedAt()).isNull();

        ReflectionTestUtils.invokeMethod(restaurant, "onCreate");

        assertThat(restaurant.getCreatedAt()).isNotNull();
        assertThat(restaurant.getCreatedAt()).isBeforeOrEqualTo(Instant.now());
    }
}
