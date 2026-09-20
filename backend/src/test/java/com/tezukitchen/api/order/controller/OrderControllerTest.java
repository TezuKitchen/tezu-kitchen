package com.tezukitchen.api.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.order.dto.request.CreateOrderRequest;
import com.tezukitchen.api.order.dto.request.OrderItemRequest;
import com.tezukitchen.api.order.dto.request.UpdateOrderStatusRequest;
import com.tezukitchen.api.order.dto.response.OrderItemResponse;
import com.tezukitchen.api.order.dto.response.OrderResponse;
import com.tezukitchen.api.order.service.OrderService;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller-level tests for OrderController.
 * <p>
 * Uses @WebMvcTest with addFilters=false to bypass the JWT security filter chain.
 * Authentication is injected via SecurityContextHolder with a UUID principal.
 */
@WebMvcTest(OrderController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID studentId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID restaurantId = UUID.randomUUID();
    private final UUID orderId = UUID.randomUUID();
    private final UUID menuItemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UUID uid, String role) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        uid, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private OrderResponse sampleOrderResponse() {
        return OrderResponse.builder()
                .id(orderId)
                .userId(studentId)
                .restaurantId(restaurantId)
                .restaurantName("Tezu Dhaba")
                .totalAmount(new BigDecimal("500.00"))
                .deliveryAddress("Hostel C, Room 101")
                .status("PLACED")
                .placedAt(Instant.now())
                .updatedAt(Instant.now())
                .items(List.of(
                        OrderItemResponse.builder()
                                .id(UUID.randomUUID())
                                .menuItemId(menuItemId)
                                .itemName("Butter Chicken")
                                .quantity(2)
                                .priceAtOrder(new BigDecimal("250.00"))
                                .build()
                ))
                .build();
    }

    // ─── POST /api/v1/orders ─────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/orders")
    class CreateOrderTests {

        @Test
        @DisplayName("should return 201 when order is placed successfully")
        void shouldReturn201_WhenOrderPlaced() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C, Room 101")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(2).build()
                    ))
                    .build();

            when(orderService.createOrder(eq(studentId), any(CreateOrderRequest.class)))
                    .thenReturn(sampleOrderResponse());

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Order placed successfully"))
                    .andExpect(jsonPath("$.data.id").value(orderId.toString()))
                    .andExpect(jsonPath("$.data.restaurantName").value("Tezu Dhaba"))
                    .andExpect(jsonPath("$.data.totalAmount").value(500.00))
                    .andExpect(jsonPath("$.data.status").value("PLACED"))
                    .andExpect(jsonPath("$.data.items", hasSize(1)));
        }

        @Test
        @DisplayName("should return 400 when restaurantId is null")
        void shouldReturn400_WhenRestaurantIdNull() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(null)
                    .deliveryAddress("Hostel C")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(1).build()
                    ))
                    .build();

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(orderService, never()).createOrder(any(), any());
        }

        @Test
        @DisplayName("should return 400 when deliveryAddress is blank")
        void shouldReturn400_WhenDeliveryAddressBlank() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(1).build()
                    ))
                    .build();

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(orderService, never()).createOrder(any(), any());
        }

        @Test
        @DisplayName("should return 400 when items list is empty")
        void shouldReturn400_WhenItemsEmpty() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of())
                    .build();

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(orderService, never()).createOrder(any(), any());
        }

        @Test
        @DisplayName("should return 400 when item quantity is zero or negative")
        void shouldReturn400_WhenItemQuantityInvalid() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(0).build()
                    ))
                    .build();

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(orderService, never()).createOrder(any(), any());
        }

        @Test
        @DisplayName("should return 400 when restaurant is closed (service throws BadRequestException)")
        void shouldReturn400_WhenRestaurantClosed() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(1).build()
                    ))
                    .build();

            when(orderService.createOrder(eq(studentId), any(CreateOrderRequest.class)))
                    .thenThrow(new BadRequestException("Restaurant is currently closed"));

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("closed")));
        }

        @Test
        @DisplayName("should return 404 when restaurant does not exist")
        void shouldReturn404_WhenRestaurantNotFound() throws Exception {
            authenticateAs(studentId, "STUDENT");

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId).quantity(1).build()
                    ))
                    .build();

            when(orderService.createOrder(eq(studentId), any(CreateOrderRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId));

            mockMvc.perform(post("/api/v1/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /api/v1/orders/{id} ─────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/orders/{id}")
    class GetOrderByIdTests {

        @Test
        @DisplayName("should return 200 with order details")
        void shouldReturn200_WithOrder() throws Exception {
            authenticateAs(studentId, "STUDENT");

            when(orderService.getOrderById(eq(studentId), eq(orderId)))
                    .thenReturn(sampleOrderResponse());

            mockMvc.perform(get("/api/v1/orders/{id}", orderId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Order retrieved successfully"))
                    .andExpect(jsonPath("$.data.id").value(orderId.toString()))
                    .andExpect(jsonPath("$.data.deliveryAddress").value("Hostel C, Room 101"))
                    .andExpect(jsonPath("$.data.items[0].itemName").value("Butter Chicken"));
        }

        @Test
        @DisplayName("should return 403 when user has no access to the order")
        void shouldReturn403_WhenForbidden() throws Exception {
            authenticateAs(studentId, "STUDENT");

            when(orderService.getOrderById(eq(studentId), eq(orderId)))
                    .thenThrow(new ForbiddenException("You do not have access to this order"));

            mockMvc.perform(get("/api/v1/orders/{id}", orderId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when order does not exist")
        void shouldReturn404_WhenNotFound() throws Exception {
            authenticateAs(studentId, "STUDENT");
            UUID nonExistentId = UUID.randomUUID();

            when(orderService.getOrderById(eq(studentId), eq(nonExistentId)))
                    .thenThrow(new ResourceNotFoundException("Order", "id", nonExistentId));

            mockMvc.perform(get("/api/v1/orders/{id}", nonExistentId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /api/v1/orders/user/{userId} ────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/orders/user/{userId}")
    class GetOrdersByUserTests {

        @Test
        @DisplayName("should return 200 with paginated orders")
        void shouldReturn200_WithPaginatedOrders() throws Exception {
            authenticateAs(studentId, "STUDENT");

            Page<OrderResponse> page = new PageImpl<>(
                    List.of(sampleOrderResponse()),
                    PageRequest.of(0, 20), 1);

            when(orderService.getOrdersByUser(eq(studentId), eq(studentId), any()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/v1/orders/user/{userId}", studentId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].id").value(orderId.toString()));
        }

        @Test
        @DisplayName("should return 200 with empty page when no orders")
        void shouldReturn200_WithEmptyPage() throws Exception {
            authenticateAs(studentId, "STUDENT");

            Page<OrderResponse> emptyPage = Page.empty(PageRequest.of(0, 20));

            when(orderService.getOrdersByUser(eq(studentId), eq(studentId), any()))
                    .thenReturn(emptyPage);

            mockMvc.perform(get("/api/v1/orders/user/{userId}", studentId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(0)));
        }

        @Test
        @DisplayName("should return 403 when trying to view another user's orders")
        void shouldReturn403_WhenViewingOtherUsersOrders() throws Exception {
            authenticateAs(studentId, "STUDENT");
            UUID otherUserId = UUID.randomUUID();

            when(orderService.getOrdersByUser(eq(studentId), eq(otherUserId), any()))
                    .thenThrow(new ForbiddenException("You can only view your own orders"));

            mockMvc.perform(get("/api/v1/orders/user/{userId}", otherUserId))
                    .andExpect(status().isForbidden());
        }
    }

    // ─── GET /api/v1/orders/restaurant/{restaurantId} ────────────────

    @Nested
    @DisplayName("GET /api/v1/orders/restaurant/{restaurantId}")
    class GetOrdersByRestaurantTests {

        @Test
        @DisplayName("should return 200 with paginated restaurant orders")
        void shouldReturn200_WithRestaurantOrders() throws Exception {
            authenticateAs(ownerId, "OWNER");

            Page<OrderResponse> page = new PageImpl<>(
                    List.of(sampleOrderResponse()),
                    PageRequest.of(0, 20), 1);

            when(orderService.getOrdersByRestaurant(eq(ownerId), eq(restaurantId), any()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/v1/orders/restaurant/{restaurantId}", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(1)));
        }

        @Test
        @DisplayName("should return 403 when non-owner tries to view restaurant orders")
        void shouldReturn403_WhenNonOwner() throws Exception {
            authenticateAs(studentId, "STUDENT");

            when(orderService.getOrdersByRestaurant(eq(studentId), eq(restaurantId), any()))
                    .thenThrow(new ForbiddenException("You are not the owner of this restaurant"));

            mockMvc.perform(get("/api/v1/orders/restaurant/{restaurantId}", restaurantId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when restaurant does not exist")
        void shouldReturn404_WhenRestaurantNotFound() throws Exception {
            authenticateAs(ownerId, "OWNER");

            when(orderService.getOrdersByRestaurant(eq(ownerId), eq(restaurantId), any()))
                    .thenThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId));

            mockMvc.perform(get("/api/v1/orders/restaurant/{restaurantId}", restaurantId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── PATCH /api/v1/orders/{id}/status ────────────────────────────

    @Nested
    @DisplayName("PATCH /api/v1/orders/{id}/status")
    class UpdateOrderStatusTests {

        @Test
        @DisplayName("should return 200 when status is updated successfully")
        void shouldReturn200_WhenStatusUpdated() throws Exception {
            authenticateAs(ownerId, "OWNER");

            OrderResponse updatedResponse = sampleOrderResponse();
            updatedResponse.setStatus("ACCEPTED");

            when(orderService.updateOrderStatus(eq(ownerId), eq(orderId), any(UpdateOrderStatusRequest.class)))
                    .thenReturn(updatedResponse);

            mockMvc.perform(patch("/api/v1/orders/{id}/status", orderId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateOrderStatusRequest("ACCEPTED"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Order status updated successfully"))
                    .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
        }

        @Test
        @DisplayName("should return 400 when status is blank")
        void shouldReturn400_WhenStatusBlank() throws Exception {
            authenticateAs(ownerId, "OWNER");

            mockMvc.perform(patch("/api/v1/orders/{id}/status", orderId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateOrderStatusRequest(""))))
                    .andExpect(status().isBadRequest());

            verify(orderService, never()).updateOrderStatus(any(), any(), any());
        }

        @Test
        @DisplayName("should return 400 when invalid transition (service throws BadRequestException)")
        void shouldReturn400_WhenInvalidTransition() throws Exception {
            authenticateAs(ownerId, "OWNER");

            when(orderService.updateOrderStatus(eq(ownerId), eq(orderId), any(UpdateOrderStatusRequest.class)))
                    .thenThrow(new BadRequestException("Cannot transition from PLACED to DELIVERED"));

            mockMvc.perform(patch("/api/v1/orders/{id}/status", orderId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateOrderStatusRequest("DELIVERED"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("Cannot transition")));
        }

        @Test
        @DisplayName("should return 403 when non-owner tries to update status")
        void shouldReturn403_WhenForbidden() throws Exception {
            authenticateAs(studentId, "STUDENT");

            when(orderService.updateOrderStatus(eq(studentId), eq(orderId), any(UpdateOrderStatusRequest.class)))
                    .thenThrow(new ForbiddenException("Only the restaurant owner can update order status"));

            mockMvc.perform(patch("/api/v1/orders/{id}/status", orderId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateOrderStatusRequest("ACCEPTED"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when order does not exist")
        void shouldReturn404_WhenOrderNotFound() throws Exception {
            authenticateAs(ownerId, "OWNER");
            UUID nonExistentId = UUID.randomUUID();

            when(orderService.updateOrderStatus(eq(ownerId), eq(nonExistentId), any(UpdateOrderStatusRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Order", "id", nonExistentId));

            mockMvc.perform(patch("/api/v1/orders/{id}/status", nonExistentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateOrderStatusRequest("ACCEPTED"))))
                    .andExpect(status().isNotFound());
        }
    }
}
