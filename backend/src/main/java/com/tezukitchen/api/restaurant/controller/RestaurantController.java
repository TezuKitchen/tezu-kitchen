package com.tezukitchen.api.restaurant.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.restaurant.dto.request.AddRestaurantImageRequest;
import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantImageResponse;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import com.tezukitchen.api.restaurant.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RestaurantResponse>> createRestaurant(
            @Valid @RequestBody CreateRestaurantRequest request) {
        UUID ownerId = getAuthenticatedUserId();
        RestaurantResponse response = restaurantService.createRestaurant(ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Restaurant created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantResponse>> getRestaurantById(@PathVariable UUID id) {
        RestaurantResponse response = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(ApiResponse.success("Restaurant retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RestaurantResponse>>> getAllRestaurants(Pageable pageable) {
        Page<RestaurantResponse> response = restaurantService.getAllRestaurants(pageable);
        return ResponseEntity.ok(ApiResponse.success("Restaurants retrieved successfully", response));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> getRestaurantsByOwner(@PathVariable UUID ownerId) {
        List<RestaurantResponse> response = restaurantService.getRestaurantsByOwner(ownerId);
        return ResponseEntity.ok(ApiResponse.success("Restaurants retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantResponse>> updateRestaurant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRestaurantRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        RestaurantResponse response = restaurantService.updateRestaurant(authenticatedUserId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Restaurant updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable UUID id) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        restaurantService.deleteRestaurant(authenticatedUserId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<ApiResponse<RestaurantImageResponse>> addImage(
            @PathVariable UUID id,
            @Valid @RequestBody AddRestaurantImageRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        RestaurantImageResponse response = restaurantService.addImage(authenticatedUserId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image added successfully", response));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(
            @PathVariable UUID id,
            @PathVariable UUID imageId) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        restaurantService.removeImage(authenticatedUserId, id, imageId);
        return ResponseEntity.noContent().build();
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
