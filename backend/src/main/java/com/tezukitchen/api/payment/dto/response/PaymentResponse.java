package com.tezukitchen.api.payment.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private BigDecimal amount;
    private String method;
    private String status;
    private String transactionRef;
    private Instant paidAt;
}
