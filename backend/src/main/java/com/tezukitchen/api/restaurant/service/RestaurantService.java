package com.tezukitchen.api.restaurant.service;

import com.tezukitchen.api.restaurant.dto.request.AddRestaurantImageRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantImageResponse;

import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface RestaurantService {
    RestaurantResponse createRestaurant(UUID ownerId, CreateRestaurantRequest request);
    RestaurantResponse getRestaurantById(UUID id);
    Page<RestaurantResponse> getAllRestaurants(Pageable pageable);
    List<RestaurantResponse> getRestaurantsByOwner(UUID ownerId);
    RestaurantResponse updateRestaurant(UUID authenticatedUserId, UUID restaurantId, UpdateRestaurantRequest request);
    void deleteRestaurant(UUID authenticatedUserId, UUID restaurantId);
    RestaurantImageResponse addImage(UUID authenticatedUserId, UUID restaurantId, AddRestaurantImageRequest request);
    void removeImage(UUID authenticatedUserId, UUID restaurantId, UUID imageId);
}
