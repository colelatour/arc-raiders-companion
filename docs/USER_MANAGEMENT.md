# User Management Feature

## Overview

The User Manager is an admin-only feature that allows administrators to view, create, and delete user accounts.

## Access

Only users with the `admin` role can access the User Manager. It appears as a third tab in the Database Manager section.

## Features

### View Users

The user list displays:
- **ID** - Unique user identifier
- **Username** - User's display name
- **Email** - User's email address
- **Role** - Either "USER" or "ADMIN" (clickable to edit)
- **Created** - Account creation date
- **Last Login** - Last login timestamp (or "Never")
- **Actions** - Edit role and Delete buttons

### Create User

Click the "Add User" button to create a new user account.

**Required fields:**
- Email (must be unique)
- Username (minimum 3 characters, must be unique)
- Password (minimum 6 characters)
- Role (User or Admin)

**Validation:**
- Email must be unique in the system
- Username must be unique and at least 3 characters
- Password must be at least 6 characters
- Password is automatically hashed using bcrypt

### Delete User

Click the trash icon next to any user to delete them.

**Important:**
- You cannot delete your own account
- Deleting a user removes all their raider profiles and progress
- This action is permanent and cannot be undone
- A confirmation dialog will appear before deletion

### Edit User Role

Click the edit icon next to any user to change their role.

**Features:**
- Toggle between "user" and "admin" roles
- Confirmation dialog before changing role
- Cannot change your own role
- Changes take effect immediately

**Example:**
- Click edit icon on a user with "USER" role → Changes to "ADMIN"
- Click edit icon on a user with "ADMIN" role → Changes to "USER"

## API Endpoints

### GET /api/admin/users
Returns all users (excluding password hashes)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "raider1",
      "role": "user",
      "created_at": "2025-12-09T12:00:00Z",
      "last_login": "2025-12-09T14:30:00Z",
      "is_active": true
    }
  ]
}
```

### POST /api/admin/users
Creates a new user account

**Request body:**
```json
{
  "email": "newuser@example.com",
  "username": "newraider",
  "password": "securepassword123",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": 5
}
```

### DELETE /api/admin/users/:id
Deletes a user account

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Error cases:**
- Cannot delete your own account (400)
- User not found (404)

### PUT /api/admin/users/:id/role
Updates a user's role

**Request body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "User role updated successfully"
}
```

**Error cases:**
- Invalid role (400)
- Cannot change your own role (400)
- User not found (404)

## Security

- All endpoints require authentication (JWT token)
- All endpoints require admin role
- Passwords are hashed with bcrypt (10 rounds)
- User cannot delete their own account
- User cannot change their own role
- Passwords are never returned in API responses

## Database Schema

The `users` table includes:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## UI Components

The UserManager component includes:
- User table with sortable columns
- Add User modal form
- Delete confirmation dialog
- Loading states
- Error handling
- Responsive design

## Future Enhancements

Potential improvements:
- Edit user details (email, username)
- Change user passwords
- Toggle user active status
- Search/filter users
- Pagination for large user lists
- Bulk user operations
- User activity logs
- Role-based permissions (more than 2 roles)
