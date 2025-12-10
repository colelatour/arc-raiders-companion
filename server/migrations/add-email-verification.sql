-- Migration: Add email verification fields to users table
-- Date: 2025-12-10

-- Add email verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

-- Create index on verification token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Update existing users to be verified (optional, for existing accounts)
-- UPDATE users SET email_verified = true WHERE created_at < NOW();
