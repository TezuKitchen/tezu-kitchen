package com.tezukitchen.api.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdatePushTokenRequest {

    @NotBlank(message = "Push token cannot be blank")
    private String pushToken;
}
