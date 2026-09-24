package com.tezukitchen.api.cart.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartResponse {
    private UUID id;
    private UUID restaurantId;
    private String restaurantName;
    @Builder.Default
    private List<CartItemResponse> items = new ArrayList<>();
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Builder.Default
    private int totalItems = 0;
}
