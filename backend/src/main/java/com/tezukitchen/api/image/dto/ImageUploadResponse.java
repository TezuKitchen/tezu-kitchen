package com.tezukitchen.api.image.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ImageUploadResponse {
    private String url;
    private String publicId;
}
