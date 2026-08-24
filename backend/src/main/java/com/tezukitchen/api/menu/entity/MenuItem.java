package com.tezukitchen.api.menu.entity;

import jakarta.persistence.*;

/**
 * MenuItem entity.
 * <p>
 * TODO: Add fields based on the team's database design
 * TODO: Do NOT invent columns — use the supplied DDL
 */
@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add fields from the team's database design
}
