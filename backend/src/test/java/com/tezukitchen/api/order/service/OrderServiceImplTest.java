package com.tezukitchen.api.order.service;

import com.tezukitchen.api.common.enums.OrderStatus;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.menu.repository.MenuItemRepository;
import com.tezukitchen.api.order.dto.request.CreateOrderRequest;
import com.tezukitchen.api.order.dto.request.OrderItemRequest;
import com.tezukitchen.api.order.dto.request.UpdateOrderStatusRequest;
import com.tezukitchen.api.order.dto.response.OrderResponse;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.order.entity.OrderItem;
import com.tezukitchen.api.order.repository.OrderRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderServiceImpl.
 * <p>
 * Covers: createOrder, getOrderById, getOrdersByUser, getOrdersByRestaurant,
 * updateOrderStatus — including access control, status transition validation,
 * restaurant closed checks, menu item cross-restaurant checks, and unavailable
 * menu item checks.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private MenuItemRepository menuItemRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    // Common IDs
    private UUID studentId;
    private UUID ownerId;
    private UUID otherUserId;
    private UUID restaurantId;
    private UUID menuItemId1;
    private UUID menuItemId2;
    private UUID orderId;

    // Common entities
    private User student;
    private User owner;
    private Restaurant restaurant;
    private MenuItem menuItem1;
    private MenuItem menuItem2;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        restaurantId = UUID.randomUUID();
        menuItemId1 = UUID.randomUUID();
        menuItemId2 = UUID.randomUUID();
        orderId = UUID.randomUUID();

        student = User.builder().id(studentId).name("Test Student").email("student@test.com").build();
        owner = User.builder().id(ownerId).name("Test Owner").email("owner@test.com").build();

        restaurant = Restaurant.builder()
                .id(restaurantId)
                .owner(owner)
                .name("Tezu Dhaba")
                .location("Main Gate")
                .isOpen(true)
                .build();

        menuItem1 = MenuItem.builder()
                .id(menuItemId1)
                .restaurant(restaurant)
                .name("Butter Chicken")
                .price(new BigDecimal("250.00"))
                .isAvailable(true)
                .category("Main Course")
                .build();

        menuItem2 = MenuItem.builder()
                .id(menuItemId2)
                .restaurant(restaurant)
                .name("Dal Makhani")
                .price(new BigDecimal("180.00"))
                .isAvailable(true)
                .category("Main Course")
                .build();
    }

    /**
     * Builds a saved Order entity with OrderItems based on the given menu items.
     */
    private Order buildSavedOrder(OrderStatus status, MenuItem... items) {
        Order order = Order.builder()
                .id(orderId)
                .user(student)
                .restaurant(restaurant)
                .deliveryAddress("Hostel C, Room 101")
                .status(status)
                .totalAmount(BigDecimal.ZERO)
                .placedAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        for (MenuItem mi : items) {
            BigDecimal itemTotal = mi.getPrice().multiply(BigDecimal.valueOf(2));
            total = total.add(itemTotal);
            orderItems.add(OrderItem.builder()
                    .id(UUID.randomUUID())
                    .order(order)
                    .menuItem(mi)
                    .quantity(2)
                    .priceAtOrder(mi.getPrice())
                    .itemNameSnapshot(mi.getName())
                    .build());
        }
        order.setTotalAmount(total);
        order.setOrderItems(orderItems);
        return order;
    }

    // ─── createOrder ─────────────────────────────────────────────────

    @Nested
    @DisplayName("createOrder")
    class CreateOrderTests {

        @Test
        @DisplayName("should create order with multiple items and calculate total")
        void shouldCreateOrder_WithMultipleItems() {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C, Room 101")
                    .items(List.of(
                            OrderItemRequest.builder().menuItemId(menuItemId1).quantity(2).build(),
                            OrderItemRequest.builder().menuItemId(menuItemId2).quantity(1).build()
                    ))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(menuItemRepository.findById(menuItemId1)).thenReturn(Optional.of(menuItem1));
            when(menuItemRepository.findById(menuItemId2)).thenReturn(Optional.of(menuItem2));
            when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
                Order saved = invocation.getArgument(0);
                saved.setId(orderId);
                saved.setPlacedAt(Instant.now());
                saved.setUpdatedAt(Instant.now());
                return saved;
            });

            OrderResponse response = orderService.createOrder(studentId, request);

            assertNotNull(response);
            assertEquals(orderId, response.getId());
            assertEquals(studentId, response.getUserId());
            assertEquals(restaurantId, response.getRestaurantId());
            assertEquals("Tezu Dhaba", response.getRestaurantName());
            assertEquals("Hostel C, Room 101", response.getDeliveryAddress());
            assertEquals("PLACED", response.getStatus());
            // 250*2 + 180*1 = 680
            assertEquals(0, new BigDecimal("680.00").compareTo(response.getTotalAmount()));
            assertEquals(2, response.getItems().size());
            verify(orderRepository).save(any(Order.class));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when user does not exist")
        void shouldThrow_WhenUserNotFound() {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.createOrder(studentId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when restaurant does not exist")
        void shouldThrow_WhenRestaurantNotFound() {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.createOrder(studentId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when restaurant is closed")
        void shouldThrow_WhenRestaurantClosed() {
            restaurant.setOpen(false);

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> orderService.createOrder(studentId, request));
            assertTrue(ex.getMessage().contains("closed"));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when menu item does not exist")
        void shouldThrow_WhenMenuItemNotFound() {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(menuItemRepository.findById(menuItemId1)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.createOrder(studentId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when menu item belongs to different restaurant")
        void shouldThrow_WhenMenuItemFromDifferentRestaurant() {
            Restaurant otherRestaurant = Restaurant.builder()
                    .id(UUID.randomUUID())
                    .owner(owner)
                    .name("Other Dhaba")
                    .build();
            MenuItem foreignItem = MenuItem.builder()
                    .id(menuItemId1)
                    .restaurant(otherRestaurant)
                    .name("Foreign Item")
                    .price(new BigDecimal("100.00"))
                    .isAvailable(true)
                    .category("Test")
                    .build();

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(menuItemRepository.findById(menuItemId1)).thenReturn(Optional.of(foreignItem));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> orderService.createOrder(studentId, request));
            assertTrue(ex.getMessage().contains("does not belong"));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when menu item is unavailable")
        void shouldThrow_WhenMenuItemUnavailable() {
            menuItem1.setAvailable(false);

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .restaurantId(restaurantId)
                    .deliveryAddress("Hostel C")
                    .items(List.of(OrderItemRequest.builder().menuItemId(menuItemId1).quantity(1).build()))
                    .build();

            when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(menuItemRepository.findById(menuItemId1)).thenReturn(Optional.of(menuItem1));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> orderService.createOrder(studentId, request));
            assertTrue(ex.getMessage().contains("unavailable"));
            verify(orderRepository, never()).save(any());
        }
    }

    // ─── getOrderById ────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrderById")
    class GetOrderByIdTests {

        @Test
        @DisplayName("should return order when accessed by the ordering user")
        void shouldReturnOrder_WhenAccessedByUser() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            OrderResponse response = orderService.getOrderById(studentId, orderId);

            assertNotNull(response);
            assertEquals(orderId, response.getId());
            assertEquals("PLACED", response.getStatus());
        }

        @Test
        @DisplayName("should return order when accessed by the restaurant owner")
        void shouldReturnOrder_WhenAccessedByOwner() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            OrderResponse response = orderService.getOrderById(ownerId, orderId);

            assertNotNull(response);
            assertEquals(orderId, response.getId());
        }

        @Test
        @DisplayName("should throw ForbiddenException when accessed by an unrelated user")
        void shouldThrow_WhenAccessedByUnrelatedUser() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThrows(ForbiddenException.class,
                    () -> orderService.getOrderById(otherUserId, orderId));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when order does not exist")
        void shouldThrow_WhenOrderNotFound() {
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.getOrderById(studentId, orderId));
        }
    }

    // ─── getOrdersByUser ─────────────────────────────────────────────

    @Nested
    @DisplayName("getOrdersByUser")
    class GetOrdersByUserTests {

        @Test
        @DisplayName("should return paginated orders for the authenticated user")
        void shouldReturnOrders_ForAuthenticatedUser() {
            Pageable pageable = PageRequest.of(0, 10);
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            Page<Order> orderPage = new PageImpl<>(List.of(order), pageable, 1);

            when(orderRepository.findByUserId(studentId, pageable)).thenReturn(orderPage);

            Page<OrderResponse> result = orderService.getOrdersByUser(studentId, studentId, pageable);

            assertEquals(1, result.getTotalElements());
            assertEquals(orderId, result.getContent().get(0).getId());
        }

        @Test
        @DisplayName("should return empty page when user has no orders")
        void shouldReturnEmptyPage_WhenNoOrders() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Order> emptyPage = Page.empty(pageable);

            when(orderRepository.findByUserId(studentId, pageable)).thenReturn(emptyPage);

            Page<OrderResponse> result = orderService.getOrdersByUser(studentId, studentId, pageable);

            assertEquals(0, result.getTotalElements());
        }

        @Test
        @DisplayName("should throw ForbiddenException when trying to view another user's orders")
        void shouldThrow_WhenViewingOtherUsersOrders() {
            Pageable pageable = PageRequest.of(0, 10);

            assertThrows(ForbiddenException.class,
                    () -> orderService.getOrdersByUser(studentId, otherUserId, pageable));
        }
    }

    // ─── getOrdersByRestaurant ───────────────────────────────────────

    @Nested
    @DisplayName("getOrdersByRestaurant")
    class GetOrdersByRestaurantTests {

        @Test
        @DisplayName("should return paginated orders for the restaurant owner")
        void shouldReturnOrders_ForRestaurantOwner() {
            Pageable pageable = PageRequest.of(0, 10);
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            Page<Order> orderPage = new PageImpl<>(List.of(order), pageable, 1);

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(orderRepository.findByRestaurantId(restaurantId, pageable)).thenReturn(orderPage);

            Page<OrderResponse> result = orderService.getOrdersByRestaurant(ownerId, restaurantId, pageable);

            assertEquals(1, result.getTotalElements());
        }

        @Test
        @DisplayName("should throw ForbiddenException when non-owner tries to view orders")
        void shouldThrow_WhenNonOwnerViewsOrders() {
            Pageable pageable = PageRequest.of(0, 10);
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            assertThrows(ForbiddenException.class,
                    () -> orderService.getOrdersByRestaurant(studentId, restaurantId, pageable));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when restaurant does not exist")
        void shouldThrow_WhenRestaurantNotFound() {
            Pageable pageable = PageRequest.of(0, 10);
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.getOrdersByRestaurant(ownerId, restaurantId, pageable));
        }
    }

    // ─── updateOrderStatus ───────────────────────────────────────────

    @Nested
    @DisplayName("updateOrderStatus")
    class UpdateOrderStatusTests {

        // ── Owner transitions ──

        @Test
        @DisplayName("owner should transition PLACED → ACCEPTED")
        void ownerShouldTransition_PlacedToAccepted() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("ACCEPTED");
            OrderResponse response = orderService.updateOrderStatus(ownerId, orderId, request);

            assertEquals("ACCEPTED", response.getStatus());
            verify(orderRepository).save(order);
        }

        @Test
        @DisplayName("owner should transition PLACED → REJECTED")
        void ownerShouldTransition_PlacedToRejected() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("REJECTED");
            OrderResponse response = orderService.updateOrderStatus(ownerId, orderId, request);

            assertEquals("REJECTED", response.getStatus());
        }

        @Test
        @DisplayName("owner should transition ACCEPTED → PREPARING")
        void ownerShouldTransition_AcceptedToPreparing() {
            Order order = buildSavedOrder(OrderStatus.ACCEPTED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("PREPARING");
            OrderResponse response = orderService.updateOrderStatus(ownerId, orderId, request);

            assertEquals("PREPARING", response.getStatus());
        }

        @Test
        @DisplayName("owner should transition PREPARING → OUT_FOR_DELIVERY")
        void ownerShouldTransition_PreparingToOutForDelivery() {
            Order order = buildSavedOrder(OrderStatus.PREPARING, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("OUT_FOR_DELIVERY");
            OrderResponse response = orderService.updateOrderStatus(ownerId, orderId, request);

            assertEquals("OUT_FOR_DELIVERY", response.getStatus());
        }

        @Test
        @DisplayName("owner should transition OUT_FOR_DELIVERY → DELIVERED")
        void ownerShouldTransition_OutForDeliveryToDelivered() {
            Order order = buildSavedOrder(OrderStatus.OUT_FOR_DELIVERY, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("DELIVERED");
            OrderResponse response = orderService.updateOrderStatus(ownerId, orderId, request);

            assertEquals("DELIVERED", response.getStatus());
        }

        // ── User cancel transitions ──

        @Test
        @DisplayName("user should be able to cancel a PLACED order")
        void userShouldCancel_PlacedOrder() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("CANCELLED");
            OrderResponse response = orderService.updateOrderStatus(studentId, orderId, request);

            assertEquals("CANCELLED", response.getStatus());
        }

        @Test
        @DisplayName("user should be able to cancel an ACCEPTED order")
        void userShouldCancel_AcceptedOrder() {
            Order order = buildSavedOrder(OrderStatus.ACCEPTED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("CANCELLED");
            OrderResponse response = orderService.updateOrderStatus(studentId, orderId, request);

            assertEquals("CANCELLED", response.getStatus());
        }

        // ── Invalid transitions ──

        @Test
        @DisplayName("should throw BadRequestException for invalid status string")
        void shouldThrow_WhenInvalidStatusString() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("INVALID_STATUS");

            assertThrows(BadRequestException.class,
                    () -> orderService.updateOrderStatus(ownerId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException for disallowed transition (PLACED → DELIVERED)")
        void shouldThrow_WhenDisallowedTransition() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("DELIVERED");

            assertThrows(BadRequestException.class,
                    () -> orderService.updateOrderStatus(ownerId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException for transition from terminal state (DELIVERED)")
        void shouldThrow_WhenTransitionFromTerminalState() {
            Order order = buildSavedOrder(OrderStatus.DELIVERED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("PLACED");

            assertThrows(BadRequestException.class,
                    () -> orderService.updateOrderStatus(ownerId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException for transition from CANCELLED state")
        void shouldThrow_WhenTransitionFromCancelledState() {
            Order order = buildSavedOrder(OrderStatus.CANCELLED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("PLACED");

            assertThrows(BadRequestException.class,
                    () -> orderService.updateOrderStatus(studentId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        // ── Access control ──

        @Test
        @DisplayName("should throw ForbiddenException when non-owner tries to accept order")
        void shouldThrow_WhenNonOwnerTriesToAccept() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("ACCEPTED");

            assertThrows(ForbiddenException.class,
                    () -> orderService.updateOrderStatus(studentId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ForbiddenException when owner tries to cancel order")
        void shouldThrow_WhenOwnerTriesToCancel() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("CANCELLED");

            assertThrows(ForbiddenException.class,
                    () -> orderService.updateOrderStatus(ownerId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ForbiddenException when unrelated user tries to cancel order")
        void shouldThrow_WhenUnrelatedUserTriesToCancel() {
            Order order = buildSavedOrder(OrderStatus.PLACED, menuItem1);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("CANCELLED");

            assertThrows(ForbiddenException.class,
                    () -> orderService.updateOrderStatus(otherUserId, orderId, request));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when order does not exist")
        void shouldThrow_WhenOrderNotFound() {
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("ACCEPTED");

            assertThrows(ResourceNotFoundException.class,
                    () -> orderService.updateOrderStatus(ownerId, orderId, request));
        }
    }
}
