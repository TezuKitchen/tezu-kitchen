package com.tezukitchen.api.favorite.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FavoriteRestaurantResponse {
    private UUID id;
    private UUID restaurantId;
    private String restaurantName;
    private String restaurantLogoUrl;
    private Instant createdAt;
}
