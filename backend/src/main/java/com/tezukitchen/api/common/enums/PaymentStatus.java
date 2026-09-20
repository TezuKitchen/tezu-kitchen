package com.tezukitchen.api.common.enums;

/**
 * Payment statuses matching PostgreSQL enum type {@code payment_status}.
 */
public enum PaymentStatus {
    PENDING,
    SUCCESS,
    FAILED,
    REFUNDED
}
