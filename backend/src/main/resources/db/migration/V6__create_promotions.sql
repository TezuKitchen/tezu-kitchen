CREATE TABLE promotions (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage DOUBLE PRECISION NOT NULL,
    max_discount_amount DOUBLE PRECISION,
    min_order_amount DOUBLE PRECISION,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expiration_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
