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

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
