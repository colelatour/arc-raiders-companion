<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ARC Raiders Companion

A comprehensive companion app for ARC Raiders players to track quests, blueprints, crafting materials, and more.

## Features

- 🎯 **Quest Tracking** - Track completed quests and objectives
- 📜 **Blueprint Manager** - Manage your blueprint collection
- 🔨 **Workbench** - Find materials needed for crafting stations
- ♻️ **Safe Items** - Know what's safe to recycle or sell
- 👤 **User Profiles** - Multiple raider profiles per account
- 🔐 **Role-Based Access** - Admin and user roles
- 📊 **Expedition System** - Track progress across wipes

## Project Structure

```
arc-raiders-companion/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utilities (API, constants)
├── server/             # Backend Express server
├── scripts/            # Database and utility scripts
├── docs/              # Documentation
└── dist/              # Production build
```

## Run Locally

**Prerequisites:** Node.js, and either PostgreSQL, SQLite, or Cloudflare D1

### Quick Start with SQLite (Easiest)

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Set up environment (copy and edit):
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and set: DB_TYPE=sqlite
   ```

3. Generate SQLite schema and create database:
   ```bash
   node scripts/convert-schema-to-sqlite.js
   sqlite3 arc_raiders.db < database-schema-sqlite.sql
   ```

4. Run the app:
   ```bash
   npm run dev           # Frontend (port 3002)
   cd server && npm start # Backend (port 5001)
   ```

### With PostgreSQL (Production-Ready)

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Set up environment (see `docs/DATABASE_SETUP.md`)

3. Initialize the database:
   ```bash
   createdb arc_raiders_db
   psql -d arc_raiders_db -f database-schema.sql
   ```

4. Run the app:
   ```bash
   npm run dev           # Frontend (port 3002)
   cd server && npm start # Backend (port 5001)
   ```

### With Cloudflare D1 (Serverless)

See [Cloudflare Deployment Guide](docs/CLOUDFLARE_DEPLOYMENT.md) for full instructions. After applying the schema to D1, run the included migration helper to ensure app-specific updates are applied:

```bash
# Apply schema then run role migration helper
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
npm run migrate:d1
```


## Documentation

- [Database Setup Guide](docs/DATABASE_SETUP.md) - PostgreSQL, SQLite, or D1
- [Cloudflare Deployment](docs/CLOUDFLARE_DEPLOYMENT.md) - Deploy to Cloudflare Workers
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Feature overview

## Database Support

This app supports multiple database backends:

- **PostgreSQL** - Best for traditional deployments (default)
- **SQLite** - Best for local development and testing
- **Cloudflare D1** - Best for serverless deployments

See [Database Setup Guide](docs/DATABASE_SETUP.md) for details.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL / SQLite / Cloudflare D1 (flexible!)
- **Auth:** JWT, bcrypt

## License

This project is not affiliated with Embark Studios. Game data sourced from community efforts.
