package com.tezukitchen.api.cart.service;

import com.tezukitchen.api.cart.dto.request.AddToCartRequest;
import com.tezukitchen.api.cart.dto.response.CartItemResponse;
import com.tezukitchen.api.cart.dto.response.CartResponse;
import com.tezukitchen.api.cart.entity.Cart;
import com.tezukitchen.api.cart.entity.CartItem;
import com.tezukitchen.api.cart.repository.CartItemRepository;
import com.tezukitchen.api.cart.repository.CartRepository;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.menu.entity.MenuItemImage;
import com.tezukitchen.api.menu.repository.MenuItemRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           UserRepository userRepository,
                           RestaurantRepository restaurantRepository,
                           MenuItemRepository menuItemRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    @Transactional
    public CartResponse getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(UUID userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);

        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", request.getMenuItemId()));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));

        if (!menuItem.getRestaurant().getId().equals(restaurant.getId())) {
            throw new BadRequestException("Menu item does not belong to the specified restaurant");
        }

        // If cart has items from a different restaurant, clear them out
        if (cart.getRestaurant() != null && !cart.getRestaurant().getId().equals(restaurant.getId())) {
            cart.getItems().clear();
        }

        cart.setRestaurant(restaurant);

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getMenuItem().getId().equals(menuItem.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .menuItem(menuItem)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        cart = cartRepository.save(cart);
        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(UUID userId, UUID menuItemId, int quantity) {
        Cart cart = getOrCreateCart(userId);

        if (quantity <= 0) {
            cart.getItems().removeIf(item -> item.getMenuItem().getId().equals(menuItemId));
        } else {
            Optional<CartItem> existingItem = cart.getItems().stream()
                    .filter(item -> item.getMenuItem().getId().equals(menuItemId))
                    .findFirst();

            if (existingItem.isPresent()) {
                existingItem.get().setQuantity(quantity);
            } else {
                MenuItem menuItem = menuItemRepository.findById(menuItemId)
                        .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));
                CartItem newItem = CartItem.builder()
                        .cart(cart)
                        .menuItem(menuItem)
                        .quantity(quantity)
                        .build();
                cart.getItems().add(newItem);
            }
        }

        if (cart.getItems().isEmpty()) {
            cart.setRestaurant(null);
        }

        cart = cartRepository.save(cart);
        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(UUID userId, UUID menuItemId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(item -> item.getMenuItem().getId().equals(menuItemId));

        if (cart.getItems().isEmpty()) {
            cart.setRestaurant(null);
        }

        cart = cartRepository.save(cart);
        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cart.setRestaurant(null);
        cartRepository.save(cart);
    }

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserIdWithItems(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            Cart newCart = Cart.builder()
                    .user(user)
                    .items(new ArrayList<>())
                    .build();
            return cartRepository.save(newCart);
        });
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            MenuItem m = item.getMenuItem();
            BigDecimal price = m.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);
            totalItems += item.getQuantity();

            String primaryImageUrl = null;
            if (m.getImages() != null && !m.getImages().isEmpty()) {
                primaryImageUrl = m.getImages().stream()
                        .filter(MenuItemImage::isPrimary)
                        .map(MenuItemImage::getImageUrl)
                        .findFirst()
                        .orElse(m.getImages().get(0).getImageUrl());
            }

            itemResponses.add(CartItemResponse.builder()
                    .id(item.getId())
                    .menuItemId(m.getId())
                    .name(m.getName())
                    .description(m.getDescription())
                    .price(m.getPrice())
                    .category(m.getCategory())
                    .available(m.isAvailable())
                    .primaryImageUrl(primaryImageUrl)
                    .quantity(item.getQuantity())
                    .subtotal(subtotal)
                    .build());
        }

        UUID restaurantId = cart.getRestaurant() != null ? cart.getRestaurant().getId() : null;
        String restaurantName = cart.getRestaurant() != null ? cart.getRestaurant().getName() : null;

        return CartResponse.builder()
                .id(cart.getId())
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .items(itemResponses)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }
}
