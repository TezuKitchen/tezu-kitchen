package com.tezukitchen.api.restaurant.entity;

import com.tezukitchen.api.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String location;

    @Builder.Default
    @Column(name = "is_open", nullable = false)
    private boolean isOpen = true;

    @Builder.Default
    @Column(name = "average_rating", precision = 3, scale = 2)
    private java.math.BigDecimal averageRating = java.math.BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
