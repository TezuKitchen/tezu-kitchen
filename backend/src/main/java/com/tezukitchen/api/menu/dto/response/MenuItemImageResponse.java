package com.tezukitchen.api.menu.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItemImageResponse {
    private UUID id;
    private String imageUrl;
    private String cloudinaryPublicId;
    @JsonProperty("isPrimary")
    private boolean isPrimary;
    private Integer displayOrder;
}
