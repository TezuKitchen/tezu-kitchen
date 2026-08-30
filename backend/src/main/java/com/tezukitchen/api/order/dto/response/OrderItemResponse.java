package com.tezukitchen.api.order.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemResponse {
    private UUID id;
    private UUID menuItemId;
    private String itemName;
    private int quantity;
    private BigDecimal priceAtOrder;
}
