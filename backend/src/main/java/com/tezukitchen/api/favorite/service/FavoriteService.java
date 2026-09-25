package com.tezukitchen.api.favorite.service;

import com.tezukitchen.api.favorite.dto.FavoriteRestaurantResponse;
import com.tezukitchen.api.favorite.entity.FavoriteRestaurant;
import com.tezukitchen.api.favorite.repository.FavoriteRestaurantRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.entity.RestaurantImage;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRestaurantRepository favoriteRestaurantRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional
    public void toggleFavorite(UUID userId, UUID restaurantId) {
        Optional<FavoriteRestaurant> existing = favoriteRestaurantRepository.findByUserIdAndRestaurantId(userId, restaurantId);
        
        if (existing.isPresent()) {
            favoriteRestaurantRepository.delete(existing.get());
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Restaurant restaurant = restaurantRepository.findById(restaurantId)
                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));
            
            FavoriteRestaurant favorite = FavoriteRestaurant.builder()
                    .user(user)
                    .restaurant(restaurant)
                    .build();
            favoriteRestaurantRepository.save(favorite);
        }
    }

    @Transactional(readOnly = true)
    public List<FavoriteRestaurantResponse> getFavoritesForUser(UUID userId) {
        return favoriteRestaurantRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FavoriteRestaurantResponse mapToResponse(FavoriteRestaurant favorite) {
        Restaurant restaurant = favorite.getRestaurant();
        String logoUrl = null;
        String bannerUrl = null;
        if (restaurant.getImages() != null) {
            logoUrl = restaurant.getImages().stream()
                    .filter(img -> "LOGO".equals(img.getImageType()))
                    .map(RestaurantImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
            bannerUrl = restaurant.getImages().stream()
                    .filter(img -> "BANNER".equals(img.getImageType()))
                    .map(RestaurantImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
        }

        return FavoriteRestaurantResponse.builder()
                .id(favorite.getId())
                .restaurantId(restaurant.getId())
                .restaurantName(restaurant.getName())
                .restaurantDescription(restaurant.getDescription())
                .restaurantLocation(restaurant.getLocation())
                .restaurantIsOpen(restaurant.isOpen())
                .restaurantLogoUrl(logoUrl)
                .restaurantBannerUrl(bannerUrl)
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
