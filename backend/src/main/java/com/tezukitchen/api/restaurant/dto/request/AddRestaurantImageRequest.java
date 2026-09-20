package com.tezukitchen.api.restaurant.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AddRestaurantImageRequest {
    @NotBlank(message = "Image URL is required")
    @Size(max = 1024)
    private String imageUrl;

    @Size(max = 512)
    private String cloudinaryPublicId;

    @NotBlank(message = "Image type is required")
    private String imageType;  // LOGO, BANNER, GALLERY

    private Integer displayOrder;
}
