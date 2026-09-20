package com.tezukitchen.api.payment.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RazorpayOrderResponse {
    private String razorpayOrderId;
    private String keyId;
    private BigDecimal amount;  // amount in paise (multiply rupees by 100)
    private String currency;
}
