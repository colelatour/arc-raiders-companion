# Project Structure

This document outlines the organization of the ARC Raiders Companion project.

## Directory Layout

```
arc-raiders-companion/
│
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   └── LoginPage.tsx        # Login/Register component
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/                   # Custom React hooks
│   │   └── useRaiderProfile.ts  # Raider profile management hook
│   ├── types/                   # TypeScript type definitions
│   │   └── types.ts             # Shared types and interfaces
│   ├── utils/                   # Utility functions
│   │   ├── api.ts               # API client (auth, raider, admin)
│   │   └── constants.ts         # Game data (quests, blueprints, etc.)
│   ├── App.tsx                  # Main application component
│   └── index.tsx                # Application entry point
│
├── server/                       # Backend Express server
│   ├── routes/                  # API routes
│   ├── middleware/              # Express middleware
│   ├── database.js              # Database connection
│   ├── server.js                # Express server setup
│   └── package.json             # Server dependencies
│
├── scripts/                      # Utility scripts
│   ├── database-schema.sql      # PostgreSQL schema with roles
│   ├── add-admin-role.sql       # Migration script for roles
│   ├── quickstart.sh            # Quick setup script
│   ├── start-servers.sh         # Start both servers
│   └── debug-auth.sh            # Authentication debugging
│
├── docs/                         # Documentation
│   ├── SETUP.md                 # Setup instructions
│   ├── IMPLEMENTATION_SUMMARY.md # Feature overview
│   ├── CHECKLIST.md             # Development checklist
│   └── PROJECT_STRUCTURE.md     # This file
│
├── dist/                         # Production build output
├── node_modules/                 # Frontend dependencies
│
├── index.html                    # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Frontend dependencies
├── .env.example                 # Environment template
└── README.md                    # Project readme

```

## Key Files

### Frontend (src/)

- **App.tsx** - Main application with all views (Home, Quests, Blueprints, Admin, etc.)
- **index.tsx** - Application bootstrapping and auth wrapper
- **components/LoginPage.tsx** - Authentication UI
- **contexts/AuthContext.tsx** - User authentication state management
- **hooks/useRaiderProfile.ts** - Profile data fetching and mutations
- **utils/api.ts** - Axios-based API client with auth/raider/admin endpoints
- **utils/constants.ts** - Static game data (quests, blueprints, crafting items)
- **types/types.ts** - TypeScript interfaces

### Backend (server/)

- **server.js** - Express server with CORS, JWT auth, and API routes
- **database.js** - PostgreSQL connection pool
- **routes/** - Modular route handlers for auth, raider profiles, admin
- **middleware/** - Authentication middleware

### Scripts

- **database-schema.sql** - Complete database schema with user roles (admin, user)
- **quickstart.sh** - One-command setup for database and servers
- **start-servers.sh** - Launch both frontend and backend

## Configuration

- **.env** - Server environment (DATABASE_URL, JWT_SECRET)
- **.env.local** - Frontend environment (API keys if needed)
- **vite.config.ts** - Vite dev server on port 3002, alias @ -> src/
- **package.json** - Scripts: `dev`, `build`, `preview`

## User Roles

The application supports two user roles:

- **user** (default) - Can track personal quests, blueprints, and profiles
- **admin** - Can manage game data (quests, blueprints) for all users

Roles are defined in the database schema with a CHECK constraint.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, PostgreSQL
- **Auth**: JWT, bcrypt
- **State**: React Context API, Custom Hooks
