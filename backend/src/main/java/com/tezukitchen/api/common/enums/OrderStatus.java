package com.tezukitchen.api.common.enums;

/**
 * Order lifecycle statuses matching PostgreSQL enum type {@code order_status}.
 */
public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    REJECTED,
    CANCELLED
}
