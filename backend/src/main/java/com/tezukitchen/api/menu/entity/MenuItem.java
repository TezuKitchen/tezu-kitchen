package com.tezukitchen.api.menu.entity;

import com.tezukitchen.api.restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "menu_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;

    @Column(nullable = false, length = 100)
    private String category;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<MenuItemImage> images = new ArrayList<>();
}
