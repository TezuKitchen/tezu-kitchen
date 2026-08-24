package com.tezukitchen.api.payment.entity;

import jakarta.persistence.*;

/**
 * Payment entity.
 * <p>
 * TODO: Add fields based on the team's database design
 * TODO: Do NOT invent columns — use the supplied DDL
 */
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields from the team's database design
}
