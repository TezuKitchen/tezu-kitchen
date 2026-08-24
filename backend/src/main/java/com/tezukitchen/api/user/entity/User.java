package com.tezukitchen.api.user.entity;

import jakarta.persistence.*;

/**
 * User entity.
 * <p>
 * TODO: Add fields based on the team's database design
 * TODO: Do NOT invent columns — use the supplied DDL
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields from the team's database design

    // Getters and setters will be added with fields
}
