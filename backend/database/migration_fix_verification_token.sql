-- Migration to fix verification_token field length
-- Run this script to update existing database

-- Change verification_token column from VARCHAR(255) to TEXT
ALTER TABLE users 
ALTER COLUMN verification_token TYPE TEXT;

-- Clear any existing truncated tokens (optional - uncomment if needed)
-- UPDATE users SET verification_token = NULL WHERE verification_token IS NOT NULL; 