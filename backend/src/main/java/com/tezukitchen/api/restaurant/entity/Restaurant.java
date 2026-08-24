package com.tezukitchen.api.restaurant.entity;

import jakarta.persistence.*;

/**
 * Restaurant entity.
 * <p>
 * TODO: Add fields based on the team's database design
 * TODO: Do NOT invent columns — use the supplied DDL
 */
@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields from the team's database design
}
