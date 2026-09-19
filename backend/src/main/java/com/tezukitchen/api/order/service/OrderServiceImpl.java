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
import com.tezukitchen.api.order.dto.response.OrderItemResponse;
import com.tezukitchen.api.order.dto.response.OrderResponse;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.order.entity.OrderItem;
import com.tezukitchen.api.order.repository.OrderRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import com.tezukitchen.api.notification.service.PushNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    /**
     * Allowed order status transitions.
     * Key = current status, Value = set of valid next statuses.
     */
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PLACED, Set.of(OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED),
            OrderStatus.ACCEPTED, Set.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, Set.of(OrderStatus.OUT_FOR_DELIVERY),
            OrderStatus.OUT_FOR_DELIVERY, Set.of(OrderStatus.DELIVERED)
    );

    private final PushNotificationService pushNotificationService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            UserRepository userRepository,
                            RestaurantRepository restaurantRepository,
                            MenuItemRepository menuItemRepository,
                            PushNotificationService pushNotificationService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(UUID userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));

        if (!restaurant.isOpen()) {
            throw new BadRequestException("Restaurant is currently closed");
        }

        Order order = Order.builder()
                .user(user)
                .restaurant(restaurant)
                .deliveryAddress(request.getDeliveryAddress())
                .status(OrderStatus.PLACED)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", itemRequest.getMenuItemId()));

            // Verify the menu item belongs to the specified restaurant
            if (!menuItem.getRestaurant().getId().equals(restaurant.getId())) {
                throw new BadRequestException(
                        "Menu item '" + menuItem.getName() + "' does not belong to restaurant '" + restaurant.getName() + "'");
            }

            // Verify item is available
            if (!menuItem.isAvailable()) {
                throw new BadRequestException("Menu item '" + menuItem.getName() + "' is currently unavailable");
            }

            // Snapshot the current price and name
            BigDecimal itemTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemRequest.getQuantity())
                    .priceAtOrder(menuItem.getPrice())
                    .itemNameSnapshot(menuItem.getName())
                    .build();

            orderItems.add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order.setOrderItems(orderItems);

        order = orderRepository.save(order);
        pushNotificationService.notifyNewOrder(order);
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID authenticatedUserId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Only the placing user or the restaurant owner can view the order
        verifyOrderAccess(authenticatedUserId, order);
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByUser(UUID authenticatedUserId, UUID userId, Pageable pageable) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ForbiddenException("You can only view your own orders");
        }
        return orderRepository.findByUserId(userId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByRestaurant(UUID authenticatedUserId, UUID restaurantId, Pageable pageable) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        if (!restaurant.getOwner().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not the owner of this restaurant");
        }

        return orderRepository.findByRestaurantId(restaurantId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID authenticatedUserId, UUID orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + request.getStatus());
        }

        OrderStatus currentStatus = order.getStatus();

        // Validate transition is allowed
        Set<OrderStatus> validNextStatuses = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!validNextStatuses.contains(newStatus)) {
            throw new BadRequestException(
                    "Cannot transition from " + currentStatus + " to " + newStatus +
                    ". Allowed transitions: " + validNextStatuses);
        }

        // Enforce who can perform the transition
        boolean isRestaurantOwner = order.getRestaurant().getOwner().getId().equals(authenticatedUserId);
        boolean isOrderingUser = order.getUser().getId().equals(authenticatedUserId);

        if (newStatus == OrderStatus.CANCELLED) {
            // Only the placing user can cancel, and only while PLACED
            if (!isOrderingUser) {
                throw new ForbiddenException("Only the user who placed the order can cancel it");
            }
            // Note: ALLOWED_TRANSITIONS already restricts CANCELLED to PLACED and ACCEPTED states
        } else {
            // All other transitions are owner-only
            if (!isRestaurantOwner) {
                throw new ForbiddenException("Only the restaurant owner can update order status");
            }
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);
        pushNotificationService.notifyOrderStatusChanged(order);
        return mapToResponse(order);
    }

    private void verifyOrderAccess(UUID authenticatedUserId, Order order) {
        boolean isOrderingUser = order.getUser().getId().equals(authenticatedUserId);
        boolean isRestaurantOwner = order.getRestaurant().getOwner().getId().equals(authenticatedUserId);
        if (!isOrderingUser && !isRestaurantOwner) {
            throw new ForbiddenException("You do not have access to this order");
        }
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem().getId())
                        .itemName(item.getItemNameSnapshot())
                        .quantity(item.getQuantity())
                        .priceAtOrder(item.getPriceAtOrder())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .restaurantId(order.getRestaurant().getId())
                .restaurantName(order.getRestaurant().getName())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .status(order.getStatus().name())
                .placedAt(order.getPlacedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .build();
    }
}
