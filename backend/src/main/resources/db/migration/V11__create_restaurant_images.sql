CREATE TABLE restaurant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    image_url VARCHAR(1024) NOT NULL,
    cloudinary_public_id VARCHAR(512),
    image_type VARCHAR(20) NOT NULL DEFAULT 'GALLERY',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurant_images_restaurant_id ON restaurant_images(restaurant_id);
