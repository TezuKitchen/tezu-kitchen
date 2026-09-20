package com.tezukitchen.api.payment;

import com.tezukitchen.api.common.enums.PaymentMethod;
import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.payment.entity.Payment;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentModuleTests {

    @Test
    @DisplayName("Payment entity builder constructs payment with valid fields")
    void paymentEntity_BuilderInitializesFields() {
        UUID paymentId = UUID.randomUUID();
        Order order = Order.builder().id(UUID.randomUUID()).build();
        Instant paidAt = Instant.now();

        Payment payment = Payment.builder()
                .id(paymentId)
                .order(order)
                .amount(new BigDecimal("499.00"))
                .method(PaymentMethod.UPI)
                .status(PaymentStatus.SUCCESS)
                .transactionRef("TXN_123456789")
                .paidAt(paidAt)
                .build();

        assertThat(payment.getId()).isEqualTo(paymentId);
        assertThat(payment.getOrder()).isSameAs(order);
        assertThat(payment.getAmount()).isEqualByComparingTo("499.00");
        assertThat(payment.getMethod()).isEqualTo(PaymentMethod.UPI);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getTransactionRef()).isEqualTo("TXN_123456789");
        assertThat(payment.getPaidAt()).isEqualTo(paidAt);
    }

    @Test
    @DisplayName("Payment prePersist defaults status to PENDING when status is null")
    void paymentEntity_PrePersistDefaultsStatusToPending() {
        Payment payment = Payment.builder()
                .amount(new BigDecimal("150.00"))
                .method(PaymentMethod.COD)
                .build();

        assertThat(payment.getStatus()).isNull();

        ReflectionTestUtils.invokeMethod(payment, "onCreate");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    @DisplayName("Payment prePersist preserves existing status if not null")
    void paymentEntity_PrePersistPreservesExistingStatus() {
        Payment payment = Payment.builder()
                .amount(new BigDecimal("150.00"))
                .method(PaymentMethod.CARD)
                .status(PaymentStatus.SUCCESS)
                .build();

        ReflectionTestUtils.invokeMethod(payment, "onCreate");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }
}
