package com.tezukitchen.api.restaurant.service;

import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository,
                                  UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public RestaurantResponse createRestaurant(UUID ownerId, CreateRestaurantRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        Restaurant restaurant = Restaurant.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .isOpen(true)
                .build();

        restaurant = restaurantRepository.save(restaurant);
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantResponse getRestaurantById(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> getAllRestaurants(Pageable pageable) {
        return restaurantRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantResponse> getRestaurantsByOwner(UUID ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public RestaurantResponse updateRestaurant(UUID authenticatedUserId, UUID restaurantId, UpdateRestaurantRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);

        restaurant.setName(request.getName());
        restaurant.setDescription(request.getDescription());
        restaurant.setLocation(request.getLocation());
        if (request.getIsOpen() != null) {
            restaurant.setOpen(request.getIsOpen());
        }

        restaurant = restaurantRepository.save(restaurant);
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional
    public void deleteRestaurant(UUID authenticatedUserId, UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);
        restaurantRepository.delete(restaurant);
    }

    private void verifyOwnership(UUID authenticatedUserId, Restaurant restaurant) {
        if (!restaurant.getOwner().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not the owner of this restaurant");
        }
    }

    private RestaurantResponse mapToResponse(Restaurant restaurant) {
        return RestaurantResponse.builder()
                .id(restaurant.getId())
                .ownerId(restaurant.getOwner().getId())
                .ownerName(restaurant.getOwner().getName())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .location(restaurant.getLocation())
                .isOpen(restaurant.isOpen())
                .createdAt(restaurant.getCreatedAt())
                .build();
    }
}
