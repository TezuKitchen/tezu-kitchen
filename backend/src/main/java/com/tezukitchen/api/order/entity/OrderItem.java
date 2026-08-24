package com.tezukitchen.api.order.entity;

import jakarta.persistence.*;

/**
 * OrderItem entity.
 * <p>
 * TODO: Add fields based on the team's database design
 * TODO: Do NOT invent columns — use the supplied DDL
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields from the team's database design
}
