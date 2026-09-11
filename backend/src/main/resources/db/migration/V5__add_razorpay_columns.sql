-- V5: Add Razorpay-specific columns to payments table
ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(255);
