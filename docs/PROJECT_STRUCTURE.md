# ARC Raiders Companion - Project Structure

## 📁 Directory Structure

```
arc-raiders-companion/
├── src/                          # Frontend React/TypeScript source
│   ├── components/               # React components
│   ├── contexts/                 # React contexts (auth, theme)
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── App.tsx                   # Main app component
│   └── index.tsx                 # App entry point
│
├── server/                       # Backend API (Cloudflare Workers)
│   ├── routes/                   # API route handlers
│   ├── middleware/               # Auth & validation middleware
│   ├── migrations/               # Database migrations
│   ├── utils/                    # Server utilities
│   ├── worker.js                 # Cloudflare Worker entry
│   ├── server.js                 # Local dev server (Node)
│   └── database-adapter.js       # Database abstraction layer
│
├── docs/                         # Documentation
│   ├── CLOUDFLARE_DEPLOYMENT.md  # Deployment guide
│   ├── DATABASE_SETUP.md         # Database setup instructions
│   ├── EMAIL_VERIFICATION.md     # Email setup guide
│   └── ...
│
├── scripts/                      # Utility scripts
│   ├── start-servers.sh          # Development startup script
│   └── ...
│
├── archive/                      # Old/backup files (not in git)
│
├── database-schema.sql           # PostgreSQL schema (reference)
├── database-schema-sqlite.sql    # SQLite/D1 schema (production)
├── wrangler.toml                 # Cloudflare Workers config
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

## 🗄️ Database Files

- **database-schema.sql** - Original PostgreSQL schema (reference only)
- **database-schema-sqlite.sql** - SQLite/Cloudflare D1 production schema
- Uses Cloudflare D1 (SQLite) in production
- Local development uses SQLite via better-sqlite3

## 🚀 Key Scripts

```bash
npm run dev          # Start local dev environment
npm run build        # Build for production
npm run preview      # Preview production build

# Cloudflare deployment
wrangler deploy      # Deploy to Cloudflare
wrangler d1 execute  # Run database commands
```

## 🔐 Environment Files

- `.env` - Local environment variables (gitignored)
- `.env.example` - Template for environment setup
- `server/.env` - Server-specific variables (gitignored)
- `server/.env.example` - Server environment template
- `wrangler.toml` - Cloudflare configuration (contains DB ID)

## 📦 Dependencies

### Frontend
- React + TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)

### Backend
- Cloudflare Workers (serverless)
- Cloudflare D1 (SQLite database)
- Hono (web framework)
- JWT authentication

## 🔧 Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Frontend | Vite dev server (5173) | Cloudflare Pages |
| Backend | Node.js (8787) | Cloudflare Workers |
| Database | Local SQLite | Cloudflare D1 |
| Auth | Local JWT | Cloudflare JWT |

## 📝 Notes

- All old/backup files moved to `archive/` directory
- Database is deployed to Cloudflare D1 (ID: 9262edba-70da...)
- Frontend deployed to: arccompanion.5tourstudios.com
