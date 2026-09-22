package com.tezukitchen.api.restaurant.dto.response;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RestaurantImageResponse {
    private UUID id;
    private String imageUrl;
    private String cloudinaryPublicId;
    private String imageType;
    private Integer displayOrder;
}
