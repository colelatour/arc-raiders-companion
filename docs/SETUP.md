# ARC Raiders Companion - Full Stack Setup Guide

A complete companion app for ARC Raiders with user authentication and database persistence.

## 🎯 Features

- ✅ User authentication (register/login/logout)
- ✅ Multiple raider profiles per user
- ✅ Quest tracking with database persistence
- ✅ Blueprint collection tracking
- ✅ Expedition system with progress wipes
- ✅ Crafting materials reference
- ✅ Safe items database
- ✅ Themed UI matching ARC Raiders aesthetic

## 📋 Prerequisites

- Node.js 18+ (https://nodejs.org/)
- PostgreSQL 14+ (https://www.postgresql.org/download/)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install Frontend Dependencies

```bash
# Install frontend dependencies
npm install
```

### 2. Setup Database

**Install PostgreSQL** (if not already installed):
- **Mac**: `brew install postgresql@16 && brew services start postgresql`
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

**Create Database:**
```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE arc_raiders_db;

# Exit psql
\q

# Run the schema (creates all tables and inserts game data)
psql -d arc_raiders_db -f database-schema.sql
```

### 3. Setup Backend Server

```bash
cd server
npm install

# Create .env file
cp .env.example .env
```

**Edit `server/.env`** with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arc_raiders_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=generate_random_secret_here_min_32_chars

PORT=5000
NODE_ENV=development
```

💡 **Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Server will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will run on http://localhost:3002

### 5. Access the App

Open http://localhost:3002 in your browser!

## 📝 Usage

1. **Register** a new account on the login page
2. **Login** with your credentials
3. Create **raider profiles** to track multiple characters
4. Mark quests as complete, track blueprints, and manage your progress
5. **Complete Expeditions** to level up (wipes quest/blueprint progress)

## 🔧 Development

### Frontend Structure
```
├── App.tsx           # Main application
├── LoginPage.tsx     # Auth UI
├── AuthContext.tsx   # Auth state management
├── api.ts            # API client
├── constants.ts      # Game data
└── types.ts          # TypeScript types
```

### Backend Structure
```
server/
├── server.js         # Express app
├── database.js       # PostgreSQL connection
├── routes/
│   ├── auth.js       # Auth endpoints
│   └── raider.js     # Profile/progress endpoints
└── middleware/
    └── auth.js       # JWT verification
```

## 🌐 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set environment variable: `VITE_API_URL=your_backend_url`

### Backend (Railway/Render/Fly.io)
1. Push `server/` folder
2. Set environment variables in hosting platform
3. Run migrations: `psql $DATABASE_URL -f ../database-schema.sql`

## 🔐 Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- CORS configured for localhost (update for production)
- Never commit `.env` files

## 🛠️ Troubleshooting

**Database connection error:**
- Ensure PostgreSQL is running: `brew services list` (Mac) or `pg_isready` (Linux)
- Check credentials in `.env`
- Verify database exists: `psql -l`

**Port already in use:**
- Change PORT in `server/.env`
- Change port in `vite.config.ts` for frontend

**Authentication not working:**
- Clear localStorage in browser
- Check JWT_SECRET is set in `.env`
- Verify backend is running

## 📚 API Documentation

See `server/README.md` for complete API endpoint documentation.

## 🎮 Game Data

All quest, blueprint, and crafting data is sourced from community spreadsheets and automatically inserted via the SQL schema.

## 📄 License

MIT

## 🙏 Credits

- Game data from community spreadsheet (Maleficent_Fee_9313)
- Built for the ARC Raiders community
- Not affiliated with Embark Studios
