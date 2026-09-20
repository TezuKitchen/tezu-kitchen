package com.tezukitchen.api.favorite.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.favorite.dto.FavoriteRestaurantResponse;
import com.tezukitchen.api.favorite.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/restaurant/{restaurantId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleFavorite(
            @PathVariable UUID restaurantId) {
        UUID userId = getAuthenticatedUserId();
        favoriteService.toggleFavorite(userId, restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Favorite status toggled"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteRestaurantResponse>>> getMyFavorites() {
        UUID userId = getAuthenticatedUserId();
        List<FavoriteRestaurantResponse> response = favoriteService.getFavoritesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Favorites retrieved successfully", response));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
