package com.tezukitchen.api.menu.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItemResponse {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private String description;
    private BigDecimal price;
    private boolean isAvailable;
    private String category;
    private String primaryImageUrl;
    private List<MenuItemImageResponse> images;
}
