# 🚀 ARC Raiders Companion - Getting Started Checklist

## Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed (`psql --version`)
- [ ] PostgreSQL running (`brew services list` on Mac or `pg_isready` on Linux)

## Database Setup
- [ ] Create database: `createdb arc_raiders_db`
- [ ] Import schema: `psql -d arc_raiders_db -f database-schema.sql`
- [ ] Verify data loaded: `psql -d arc_raiders_db -c "SELECT COUNT(*) FROM quests;"`
  - Should show 63 quests

## Backend Configuration
- [ ] Navigate to server: `cd server`
- [ ] Copy env file: `cp .env.example .env` (if not exists)
- [ ] Edit `server/.env`:
  - [ ] Set `DB_PASSWORD` to your PostgreSQL password
  - [ ] Generate `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - [ ] Verify all other settings (DB_HOST, DB_PORT, DB_NAME, DB_USER)
- [ ] Install dependencies: `npm install`
- [ ] Test connection: `npm run dev`
  - Should see: "✅ Connected to PostgreSQL database"
  - Should see: "🚀 Server running on http://localhost:5000"

## Frontend Configuration
- [ ] Return to root: `cd ..`
- [ ] Copy env file: `cp .env.example .env` (if not exists)
- [ ] Verify `.env` has: `VITE_API_URL=http://localhost:5000/api`
- [ ] Install dependencies: `npm install` (if not done)

## Running the Application

### Start Backend (Terminal 1)
```bash
cd server
npm run dev
```
✅ Look for: "Server running on http://localhost:5000"

### Start Frontend (Terminal 2)
```bash
npm run dev
```
✅ Look for: "Local: http://localhost:3002"

## Testing

### 1. Backend Health Check
```bash
curl http://localhost:5000/api/health
```
✅ Expected: `{"status":"ok","message":"ARC Raiders API is running"}`

### 2. Register a Test User
Open http://localhost:3002 in your browser
- [ ] Click "Register" tab
- [ ] Fill in:
  - Email: `test@example.com`
  - Username: `TestRaider`
  - Password: `password123`
- [ ] Click "Create Account"
- [ ] Should redirect to main app

### 3. Verify Data Persistence
- [ ] Mark a quest as complete
- [ ] Refresh the page
- [ ] Quest should still be marked
- [ ] Logout and login again
- [ ] Quest should still be marked

## Troubleshooting

### Database Connection Errors
```bash
# Check PostgreSQL is running
brew services list  # Mac
pg_isready         # Linux

# Test connection manually
psql -d arc_raiders_db -c "SELECT 1;"
```

### Port Already in Use
Backend port (5000):
- Edit `PORT` in `server/.env`

Frontend port (3002):
- Edit `port` in `vite.config.ts`

### Can't Login
- [ ] Check backend console for errors
- [ ] Verify JWT_SECRET is set in `server/.env`
- [ ] Clear browser localStorage (F12 → Application → Local Storage → Clear)
- [ ] Restart both servers

### CORS Errors
- [ ] Verify frontend URL matches CORS origin in `server/server.js`
- [ ] Default is `http://localhost:3002`

## Deployment Checklist (When Ready)

### Database (Choose One)
- [ ] Railway PostgreSQL
- [ ] Render PostgreSQL
- [ ] Supabase
- [ ] Your own server

### Backend (Choose One)
- [ ] Railway
- [ ] Render
- [ ] Fly.io
- [ ] Vercel (serverless functions)

### Frontend (Choose One)
- [ ] Vercel
- [ ] Netlify
- [ ] GitHub Pages (with backend API)

### Environment Variables
Backend:
- [ ] DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- [ ] JWT_SECRET (generate new one for production!)
- [ ] NODE_ENV=production

Frontend:
- [ ] VITE_API_URL=https://your-backend-url.com/api

### Security Updates
- [ ] Update CORS origin in `server/server.js` to production frontend URL
- [ ] Generate new JWT_SECRET for production
- [ ] Ensure DATABASE_URL uses SSL in production
- [ ] Add rate limiting to API endpoints
- [ ] Enable HTTPS on both frontend and backend

## Success! 🎉

If all checkboxes are marked, you have:
- ✅ Full-stack application running locally
- ✅ User authentication working
- ✅ Database persistence enabled
- ✅ All game data loaded
- ✅ Ready to deploy!

## Need Help?

Check these files:
- `SETUP.md` - Detailed setup guide
- `IMPLEMENTATION_SUMMARY.md` - Complete technical overview
- `server/README.md` - API documentation

Good luck, Raider! 🎮
