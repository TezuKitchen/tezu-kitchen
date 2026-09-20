package com.tezukitchen.api.order;

import com.tezukitchen.api.common.enums.OrderStatus;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.order.entity.OrderItem;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrderModuleTests {

    @Test
    @DisplayName("Order entity builder initializes empty items list and properties")
    void orderEntity_BuilderInitializesProperties() {
        UUID orderId = UUID.randomUUID();
        User user = User.builder().id(UUID.randomUUID()).name("Student").build();
        Restaurant restaurant = Restaurant.builder().id(UUID.randomUUID()).name("Cafe").build();

        Order order = Order.builder()
                .id(orderId)
                .user(user)
                .restaurant(restaurant)
                .deliveryAddress("Hostel B Room 204")
                .totalAmount(new BigDecimal("250.00"))
                .status(OrderStatus.PLACED)
                .build();

        assertThat(order.getId()).isEqualTo(orderId);
        assertThat(order.getUser()).isSameAs(user);
        assertThat(order.getRestaurant()).isSameAs(restaurant);
        assertThat(order.getDeliveryAddress()).isEqualTo("Hostel B Room 204");
        assertThat(order.getTotalAmount()).isEqualByComparingTo("250.00");
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getOrderItems()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("Order prePersist sets status to PLACED, placedAt, and updatedAt when missing")
    void orderEntity_PrePersistSetsDefaults() {
        Order order = Order.builder()
                .deliveryAddress("Hostel C")
                .totalAmount(new BigDecimal("100.00"))
                .build();

        assertThat(order.getStatus()).isNull();
        assertThat(order.getPlacedAt()).isNull();
        assertThat(order.getUpdatedAt()).isNull();

        ReflectionTestUtils.invokeMethod(order, "onCreate");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getPlacedAt()).isNotNull();
        assertThat(order.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("OrderItem entity stores snapshot of item name and price at order time")
    void orderItemEntity_StoresItemSnapshot() {
        UUID itemId = UUID.randomUUID();
        MenuItem menuItem = MenuItem.builder()
                .id(itemId)
                .name("Veg Roll")
                .price(new BigDecimal("70.00"))
                .build();

        OrderItem orderItem = OrderItem.builder()
                .id(UUID.randomUUID())
                .menuItem(menuItem)
                .itemNameSnapshot("Veg Roll")
                .priceAtOrder(new BigDecimal("70.00"))
                .quantity(3)
                .build();

        assertThat(orderItem.getMenuItem()).isSameAs(menuItem);
        assertThat(orderItem.getItemNameSnapshot()).isEqualTo("Veg Roll");
        assertThat(orderItem.getPriceAtOrder()).isEqualByComparingTo("70.00");
        assertThat(orderItem.getQuantity()).isEqualTo(3);
    }
}
