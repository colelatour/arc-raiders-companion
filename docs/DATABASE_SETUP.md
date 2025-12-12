# Database Setup Guide

This guide explains how to use the ARC Raiders Companion API with different database backends: **PostgreSQL**, **SQLite**, and **Cloudflare D1**.

## Database Support

The application uses a database abstraction layer that supports:

1. **PostgreSQL** - Best for traditional deployments (default)
2. **SQLite** - Best for local development and testing
3. **Cloudflare D1** - Best for serverless deployments on Cloudflare

## Configuration

Set the `DB_TYPE` environment variable in your `.env` file:

```env
DB_TYPE=postgres  # or 'sqlite' or 'd1'
```

---

## 1. PostgreSQL Setup (Default)

### Local Development

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-15
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   createdb arc_raiders_db
   ```

3. **Run Schema**
   ```bash
   psql -d arc_raiders_db -f database-schema.sql
   ```

4. **Configure `.env`**
   ```env
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=arc_raiders_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Cloud Deployment (Production)

Configure `DATABASE_URL` instead of individual variables:

```env
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@host:5432/database

# Examples:
# Heroku: postgres://user:pass@ec2-xxx.compute-1.amazonaws.com:5432/dbname
# Railway: postgresql://postgres:pass@containers-us-west.railway.app:5432/railway
# Render: postgres://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/dbname
# Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
```

---

## 2. SQLite Setup

### Installation

SQLite is built into most systems. For development, install `better-sqlite3`:

```bash
cd server
npm install better-sqlite3
```

### Create Database

1. **Generate SQLite Schema**
   ```bash
   node scripts/convert-schema-to-sqlite.js
   ```

2. **Create Database**
   ```bash
   sqlite3 arc_raiders.db < database-schema-sqlite.sql
   ```

### Configure `.env`

```env
DB_TYPE=sqlite
SQLITE_DB_PATH=./arc_raiders.db
```

### Advantages
- ✅ No server setup required
- ✅ Single file database
- ✅ Perfect for local development
- ✅ Fast for small to medium datasets

### Limitations
- ⚠️ Not suitable for high-concurrency production use
- ⚠️ Limited to single-server deployments

---

## 3. Cloudflare D1 Setup

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

### Setup Steps

1. **Create D1 Database**
   ```bash
   wrangler d1 create arc-raiders-db
   ```
   
   This outputs a database ID. Copy it!

2. **Update `wrangler.toml`**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "arc-raiders-db"
   database_id = "your-database-id-here"
   ```

3. **Convert and Run Schema**
   ```bash
   # Generate SQLite-compatible schema
   node scripts/convert-schema-to-sqlite.js
   
   # Apply schema to D1
   wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
   ```

4. **Deploy Worker**
   ```bash
   wrangler deploy
   ```

### Configure Environment Variables

Set secrets in Cloudflare:
```bash
wrangler secret put JWT_SECRET
wrangler secret put EMAIL_PASSWORD
```

### Local Development with D1

```bash
# Test with local D1
wrangler dev

# Or use SQLite locally, D1 in production
DB_TYPE=sqlite npm run dev
```

### Advantages
- ✅ Serverless, auto-scaling
- ✅ Global distribution
- ✅ Pay per request (cheap for small apps)
- ✅ No server maintenance

---

## Database Adapter Usage

The abstraction layer automatically handles differences between databases:

### In Your Code

```javascript
import db from './database.js';

// Works with PostgreSQL, SQLite, and D1!
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);

const users = result.rows;
```

### Key Features

- **Automatic Parameter Conversion**: `$1, $2` → `?` (SQLite) or `?1, ?2` (D1)
- **Unified Result Format**: Always returns `{ rows: [], rowCount: number }`
- **RETURNING Clause Handling**: Automatically emulated for SQLite
- **Error Handling**: Consistent error messages across databases

---

## Migration Between Databases

### PostgreSQL → SQLite

```bash
# 1. Export data from PostgreSQL
pg_dump -d arc_raiders_db --data-only --inserts > data.sql

# 2. Convert schema
node scripts/convert-schema-to-sqlite.js

# 3. Import to SQLite
sqlite3 arc_raiders.db < database-schema-sqlite.sql
sqlite3 arc_raiders.db < data.sql
```

### SQLite → D1

```bash
# D1 uses SQLite syntax, so schema is compatible
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
```

### PostgreSQL → D1

```bash
# 1. Convert schema
node scripts/convert-schema-to-sqlite.js

# 2. Apply to D1
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql

# 3. Export and convert data as needed
```

---

## Testing Different Databases

You can test all three databases:

```bash
# Test with PostgreSQL
DB_TYPE=postgres npm run dev

# Test with SQLite
DB_TYPE=sqlite npm run dev

# Test with D1 (requires wrangler)
wrangler dev
```

---

## Production Recommendations

### Small Apps (< 10k users)
- **Best**: Cloudflare D1 (free tier, global)
- **Alternative**: SQLite with backups

### Medium Apps (10k - 100k users)
- **Best**: PostgreSQL on managed service (Render, Railway, Neon)
- **Alternative**: Cloudflare D1 (paid tier)

### Large Apps (> 100k users)
- **Best**: PostgreSQL with read replicas (AWS RDS, Supabase)
- **Consider**: Connection pooling (PgBouncer)

---

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U postgres -d arc_raiders_db
```

### SQLite Permission Issues

```bash
# Ensure database file is writable
chmod 664 arc_raiders.db
chmod 775 .  # Directory must be writable too
```

### D1 Deployment Issues

```bash
# Check D1 status
wrangler d1 info arc-raiders-db

# View D1 logs
wrangler tail
```

---

## Environment Variables Reference

| Variable | PostgreSQL | SQLite | D1 |
|----------|-----------|--------|-----|
| `DB_TYPE` | `postgres` | `sqlite` | Auto-set |
| `DB_HOST` | ✅ Required | ❌ | ❌ |
| `DB_PORT` | ✅ Required | ❌ | ❌ |
| `DB_NAME` | ✅ Required | ❌ | ❌ |
| `DB_USER` | ✅ Required | ❌ | ❌ |
| `DB_PASSWORD` | ✅ Required | ❌ | ❌ |
| `DATABASE_URL` | ✅ Optional | ❌ | ❌ |
| `SQLITE_DB_PATH` | ❌ | ✅ Optional | ❌ |

---

## Need Help?

- PostgreSQL: https://www.postgresql.org/docs/
- SQLite: https://www.sqlite.org/docs.html
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
