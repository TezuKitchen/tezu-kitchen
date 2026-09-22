package com.tezukitchen.api.image.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.tezukitchen.api.common.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.List;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public record ImageUploadResult(String url, String publicId) {}

    public ImageUploadResult upload(MultipartFile file, String folder) {
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Invalid content type. Only JPEG, PNG, and WebP are allowed.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size must not exceed 3MB");
        }
        
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "tezu-kitchen/" + folder,
                    "resource_type", "image",
                    "transformation", new Transformation().width(1200).crop("limit").quality("auto:eco")
            ));
            String url = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");
            return new ImageUploadResult(url, publicId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image", e);
        }
    }
}
