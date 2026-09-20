package com.tezukitchen.api.image.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.image.dto.ImageUploadResponse;
import com.tezukitchen.api.image.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/images")
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;
    private static final List<String> ALLOWED_FOLDERS = List.of("avatars", "restaurants", "menu-items");

    public ImageUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("folder") String folder) {
            
        if (!ALLOWED_FOLDERS.contains(folder)) {
            throw new BadRequestException("Invalid folder. Must be one of: avatars, restaurants, menu-items");
        }
        
        var result = cloudinaryService.upload(file, folder);
        ImageUploadResponse response = ImageUploadResponse.builder()
                .url(result.url())
                .publicId(result.publicId())
                .build();
                
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded successfully", response));
    }
}
