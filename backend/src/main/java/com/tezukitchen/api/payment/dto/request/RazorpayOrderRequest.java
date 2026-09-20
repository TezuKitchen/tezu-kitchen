package com.tezukitchen.api.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RazorpayOrderRequest {
    @NotNull(message = "Order ID is required")
    private UUID orderId;
}
