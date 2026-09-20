package com.tezukitchen.api.menu;

import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MenuModuleTests {

    @Test
    @DisplayName("MenuItem builder defaults isAvailable to true")
    void menuItemEntity_DefaultsIsAvailableToTrue() {
        MenuItem item = MenuItem.builder()
                .name("Paneer Butter Masala")
                .price(new BigDecimal("180.00"))
                .category("Main Course")
                .build();

        assertThat(item.isAvailable()).isTrue();
    }

    @Test
    @DisplayName("MenuItem entity retains restaurant relationship and attributes")
    void menuItemEntity_RetainsRestaurantAndProperties() {
        UUID restaurantId = UUID.randomUUID();
        Restaurant restaurant = Restaurant.builder()
                .id(restaurantId)
                .name("Campus Dhaba")
                .location("Hostel Block")
                .build();

        UUID menuItemId = UUID.randomUUID();
        MenuItem item = MenuItem.builder()
                .id(menuItemId)
                .restaurant(restaurant)
                .name("Cold Coffee")
                .description("Chilled brewed coffee")
                .price(new BigDecimal("60.00"))
                .isAvailable(false)
                .category("Beverages")
                .build();

        assertThat(item.getId()).isEqualTo(menuItemId);
        assertThat(item.getRestaurant()).isSameAs(restaurant);
        assertThat(item.getRestaurant().getId()).isEqualTo(restaurantId);
        assertThat(item.getName()).isEqualTo("Cold Coffee");
        assertThat(item.getPrice()).isEqualByComparingTo("60.00");
        assertThat(item.isAvailable()).isFalse();
        assertThat(item.getCategory()).isEqualTo("Beverages");
    }
}
