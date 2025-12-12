# Quick Reference: Database Setup

## Choose Your Database

### Option 1: PostgreSQL (Current Setup)
**Best for**: Production, complex queries, high concurrency

```bash
# .env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arc_raiders_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Setup**:
```bash
createdb arc_raiders_db
psql -d arc_raiders_db -f database-schema.sql
npm run dev
```

---

### Option 2: SQLite (Easiest)
**Best for**: Local development, testing, single-user apps

```bash
# .env
DB_TYPE=sqlite
SQLITE_DB_PATH=./arc_raiders.db
```

**Setup**:
```bash
npm install better-sqlite3
node scripts/convert-schema-to-sqlite.js
sqlite3 arc_raiders.db < database-schema-sqlite.sql
npm run dev
```

---

### Option 3: Cloudflare D1 (Serverless)
**Best for**: Global deployment, serverless, edge computing

```bash
# Configured in wrangler.toml, not .env
```

**Setup**:
```bash
npm install -g wrangler
wrangler login
wrangler d1 create arc-raiders-db
# Copy database_id to wrangler.toml
node scripts/convert-schema-to-sqlite.js
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
wrangler deploy
```

---

## Common Commands

### PostgreSQL
```bash
# Create database
createdb arc_raiders_db

# Run migrations
psql -d arc_raiders_db -f database-schema.sql

# Connect to database
psql -d arc_raiders_db

# Backup
pg_dump arc_raiders_db > backup.sql
```

### SQLite
```bash
# Create database
sqlite3 arc_raiders.db < database-schema-sqlite.sql

# Connect to database
sqlite3 arc_raiders.db

# Run query
sqlite3 arc_raiders.db "SELECT COUNT(*) FROM users;"

# Backup (just copy the file)
cp arc_raiders.db arc_raiders_backup.db
```

### Cloudflare D1
```bash
# Create database
wrangler d1 create arc-raiders-db

# Run migrations
wrangler d1 execute arc-raiders-db --file=schema.sql

# Query
wrangler d1 execute arc-raiders-db --command="SELECT COUNT(*) FROM users"

# Backup
wrangler d1 export arc-raiders-db --output=backup.sql

# Deploy
wrangler deploy

# View logs
wrangler tail
```

---

## Switching Databases

### PostgreSQL → SQLite
```bash
# 1. Update .env
DB_TYPE=sqlite

# 2. Install SQLite
npm install better-sqlite3

# 3. Create SQLite database
node scripts/convert-schema-to-sqlite.js
sqlite3 arc_raiders.db < database-schema-sqlite.sql

# 4. Migrate data (optional)
pg_dump -d arc_raiders_db --data-only --inserts > data.sql
sqlite3 arc_raiders.db < data.sql
```

### SQLite → D1
```bash
# 1. Create D1 database
wrangler d1 create arc-raiders-db

# 2. Use SQLite schema (compatible!)
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql

# 3. Migrate data
sqlite3 arc_raiders.db ".dump --data-only" > data.sql
wrangler d1 execute arc-raiders-db --file=data.sql
```

---

## Environment Variables

| Variable | PostgreSQL | SQLite | D1 |
|----------|-----------|--------|-----|
| `DB_TYPE` | `postgres` | `sqlite` | Auto |
| `DB_HOST` | ✅ | ❌ | ❌ |
| `DB_PORT` | ✅ | ❌ | ❌ |
| `DB_NAME` | ✅ | ❌ | ❌ |
| `DB_USER` | ✅ | ❌ | ❌ |
| `DB_PASSWORD` | ✅ | ❌ | ❌ |
| `DATABASE_URL` | ✅ | ❌ | ❌ |
| `SQLITE_DB_PATH` | ❌ | ✅ | ❌ |

---

## Troubleshooting

### PostgreSQL Issues
```bash
# Check if running
pg_isready

# Restart
brew services restart postgresql

# Check logs
tail -f /usr/local/var/log/postgresql@15.log
```

### SQLite Issues
```bash
# Check file permissions
ls -la arc_raiders.db

# Fix permissions
chmod 664 arc_raiders.db

# Verify schema
sqlite3 arc_raiders.db ".schema users"
```

### D1 Issues
```bash
# Check database info
wrangler d1 info arc-raiders-db

# View tables
wrangler d1 execute arc-raiders-db --command=".tables"

# Check logs
wrangler tail
```

---

## Quick Comparison

| Feature | PostgreSQL | SQLite | D1 |
|---------|-----------|--------|-----|
| **Setup Time** | ~10 min | ~2 min | ~5 min |
| **Local Dev** | Good | Excellent | Good |
| **Production** | Excellent | Poor | Excellent |
| **Free Tier** | ❌ | ✅ | ✅ |
| **Scaling** | Manual | N/A | Auto |
| **Global** | ❌ | ❌ | ✅ |
| **Complexity** | Medium | Low | Medium |

---

## Need Help?

- **Full Setup Guide**: [docs/DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Cloudflare Deploy**: [docs/CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- **Migration Guide**: [docs/DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)
- **Summary**: [docs/MULTI_DATABASE_SUMMARY.md](./MULTI_DATABASE_SUMMARY.md)
