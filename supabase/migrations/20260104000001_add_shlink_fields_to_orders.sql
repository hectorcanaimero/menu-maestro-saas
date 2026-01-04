-- Migration: Add Shlink URL shortener fields to orders table
-- Purpose: Store shortened URLs for payment proof links shared via WhatsApp
-- Author: Claude Code
-- Date: 2026-01-04

-- Add columns for shortened URLs
ALTER TABLE orders
ADD COLUMN payment_proof_short_url TEXT,
ADD COLUMN payment_proof_short_code TEXT;

-- Create partial index for fast lookup by short code
-- Only index non-null values for efficiency
CREATE INDEX idx_orders_payment_proof_short_code
ON orders(payment_proof_short_code)
WHERE payment_proof_short_code IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN orders.payment_proof_short_url IS 'Shortened URL from Shlink service (e.g., https://x.pideai.com/abc123) - used in WhatsApp messages';
COMMENT ON COLUMN orders.payment_proof_short_code IS 'Short code from Shlink (e.g., abc123) - used for retrieving click statistics';
