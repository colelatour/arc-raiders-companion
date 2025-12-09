-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Create index for role queries
CREATE INDEX idx_users_role ON users(role);

-- Update existing users to have 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Set the test user as admin (optional - you can change this)
UPDATE users SET role = 'admin' WHERE email = 'raider@test.com';

-- Add some comments
COMMENT ON COLUMN users.role IS 'User role: user, admin, or manager';
