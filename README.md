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

**Prerequisites:** Node.js, PostgreSQL

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Set up environment variables (see `docs/SETUP.md`)

3. Initialize the database:
   ```bash
   psql -U postgres -f scripts/database-schema.sql
   ```

4. Run the app:
   ```bash
   npm run dev           # Frontend (port 3002)
   cd server && npm start # Backend (port 3001)
   ```

Or use the quick start script:
```bash
./scripts/quickstart.sh
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Feature overview
- [Checklist](docs/CHECKLIST.md) - Development progress

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JWT, bcrypt

## License

This project is not affiliated with Embark Studios. Game data sourced from community efforts.
