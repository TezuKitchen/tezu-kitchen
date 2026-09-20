package com.tezukitchen.api.favorite.entity;

import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "favorite_restaurants", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "restaurant_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FavoriteRestaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
