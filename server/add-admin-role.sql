-- Run this SQL in your database to add admin roles
-- You can run it with: psql -d arcraiders -f add-admin-role.sql
-- Or paste it directly into psql or a database GUI

-- Step 1: Add role column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- Step 2: Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 3: Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Step 4: Make the test user an admin (CHANGE THIS EMAIL IF NEEDED)
UPDATE users SET role = 'admin' WHERE email = 'raider@test.com';

-- Step 5: Verify
SELECT id, email, username, role FROM users;

-- Note: Valid roles are: 'user', 'admin', 'manager'
-- admin = full access to edit quests/blueprints/etc
-- manager = can manage content
-- user = regular user
