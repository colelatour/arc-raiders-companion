-- Add theme preference column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark';

-- Add index for faster theme lookups
CREATE INDEX IF NOT EXISTS idx_users_theme ON users(theme);

-- Update existing users to have dark theme (default)
UPDATE users SET theme = 'dark' WHERE theme IS NULL;
