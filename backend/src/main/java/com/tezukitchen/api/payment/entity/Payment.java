package com.tezukitchen.api.payment.entity;

import com.tezukitchen.api.common.enums.PaymentMethod;
import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.order.entity.Order;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "payment_method")
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "payment_status")
    private PaymentStatus status;

    @Column(name = "transaction_ref")
    private String transactionRef;

    @Column(name = "paid_at", columnDefinition = "TIMESTAMPTZ")
    private Instant paidAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = PaymentStatus.PENDING;
    }
}
