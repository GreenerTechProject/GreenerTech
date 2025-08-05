-- Migration to add telephone and cin fields to users table
-- Run this script to update existing database

ALTER TABLE users 
ADD COLUMN telephone VARCHAR(20) NULL,
ADD COLUMN cin VARCHAR(50) NULL;

-- Update existing records if needed
-- UPDATE users SET telephone = NULL, cin = NULL WHERE telephone IS NULL OR cin IS NULL; 