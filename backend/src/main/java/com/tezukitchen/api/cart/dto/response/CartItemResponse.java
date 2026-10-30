package com.tezukitchen.api.cart.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItemResponse {
    private UUID id;
    private UUID menuItemId;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private boolean available;
    private String primaryImageUrl;
    private int quantity;
    private BigDecimal subtotal;
}
