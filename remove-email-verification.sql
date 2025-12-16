-- This script modifies the existing 'users' table to remove all columns
-- related to email verification. It preserves all existing user data.

-- Step 1: Create a new users table without the email verification columns.
CREATE TABLE users_new (
  id INTEGER NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  theme VARCHAR(10) DEFAULT 'dark',
  UNIQUE (email),
  UNIQUE (username)
);

-- Step 2: Copy existing users from the old table to the new one.
-- This preserves all your user accounts and their passwords.
INSERT INTO users_new (id, email, username, password_hash, role, created_at, updated_at, last_login, is_active, theme)
SELECT id, email, username, password_hash, role, created_at, updated_at, last_login, is_active, theme
FROM users;

-- Step 3: Drop the old, outdated users table.
DROP TABLE users;

-- Step 4: Rename the new table to 'users'.
ALTER TABLE users_new RENAME TO users;

-- The 'users' table is now updated.
