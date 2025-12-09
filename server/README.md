# ARC Raiders Companion - Backend Server

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Setup PostgreSQL Database

Install PostgreSQL if you haven't already:
- **Mac**: `brew install postgresql@16`
- **Windows**: Download from https://www.postgresql.org/download/
- **Linux**: `sudo apt-get install postgresql`

Create the database:
```bash
# Start PostgreSQL
pg_ctl start

# Create database
createdb arc_raiders_db

# Run the schema
psql -d arc_raiders_db -f ../database-schema.sql
```

### 3. Configure Environment Variables

Copy the example file and edit it:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arcraiders
DB_USER=postgres
DB_PASSWORD=clatour0

JWT_SECRET=generate_a_random_string_here

PORT=5000
NODE_ENV=development
```

### 4. Start the Server

```bash
npm run dev
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Raider Profiles (Requires Auth)
- `GET /api/raider/profiles` - Get all profiles
- `POST /api/raider/profiles` - Create new profile
- `DELETE /api/raider/profiles/:id` - Delete profile
- `GET /api/raider/profiles/:id/stats` - Get profile stats
- `GET /api/raider/profiles/:id/quests` - Get completed quests
- `POST /api/raider/profiles/:id/quests/:questId` - Toggle quest
- `GET /api/raider/profiles/:id/blueprints` - Get owned blueprints
- `POST /api/raider/profiles/:id/blueprints/:name` - Toggle blueprint
- `POST /api/raider/profiles/:id/expedition/complete` - Complete expedition (wipe & level up)

## Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Register a test user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```
