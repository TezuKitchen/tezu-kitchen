package com.tezukitchen.api.menu.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AddMenuItemImageRequest {
    @NotBlank(message = "Image URL is required")
    @Size(max = 1024)
    private String imageUrl;

    @Size(max = 512)
    private String cloudinaryPublicId;

    @JsonProperty("isPrimary")
    @Builder.Default
    private boolean isPrimary = false;
    private Integer displayOrder;
}
