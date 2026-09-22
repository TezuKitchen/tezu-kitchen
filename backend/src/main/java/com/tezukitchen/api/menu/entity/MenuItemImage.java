package com.tezukitchen.api.menu.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "menu_item_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "image_url", nullable = false, length = 1024)
    private String imageUrl;

    @Column(name = "cloudinary_public_id", length = 512)
    private String cloudinaryPublicId;

    @Builder.Default
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
