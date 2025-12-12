# ✅ Schema Compatibility: SQLite & Cloudflare D1

## Short Answer

**No**, the current `database-schema.sql` does **NOT** work directly with SQLite or Wrangler/D1.

**But**, I created a converter script that automatically fixes it!

## The Problem

Your `database-schema.sql` uses PostgreSQL-specific syntax:

```sql
-- PostgreSQL syntax (doesn't work in SQLite/D1)
CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  -- ❌
  email VARCHAR(255) NOT NULL,                                    -- ❌
  role VARCHAR(20) DEFAULT 'user'::character varying,            -- ❌
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- ⚠️
  is_active BOOLEAN DEFAULT true,                                 -- ❌
  UNIQUE (email)
);

DROP TABLE IF EXISTS users CASCADE;                               -- ❌
CREATE INDEX idx_users ON public.users USING btree (email);       -- ❌
```

### PostgreSQL vs SQLite Differences

| Feature | PostgreSQL | SQLite/D1 |
|---------|-----------|-----------|
| Auto-increment | `GENERATED ALWAYS AS IDENTITY` | `AUTOINCREMENT` |
| String type | `VARCHAR(n)` | `TEXT` |
| Boolean | `BOOLEAN`, `true`/`false` | `INTEGER`, `1`/`0` |
| Timestamp | `TIMESTAMP` | `TEXT` |
| Type casts | `'user'::character varying` | Not supported |
| CASCADE | `DROP ... CASCADE` | Not needed |
| Schema qualifier | `public.table` | Not used |
| Index syntax | `USING btree` | Not needed |

## The Solution

Run the converter script:

```bash
node scripts/convert-schema-to-sqlite.js
```

This generates `database-schema-sqlite.sql` with proper SQLite syntax:

```sql
-- SQLite/D1 compatible syntax (works!)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,                  -- ✅
  email TEXT NOT NULL,                                   -- ✅
  role TEXT DEFAULT 'user',                              -- ✅
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,             -- ✅
  is_active INTEGER DEFAULT 1,                           -- ✅
  UNIQUE (email)
);

DROP TABLE IF EXISTS users;                              -- ✅
CREATE INDEX idx_users ON users (email);                 -- ✅
```

## Using the Converted Schema

### With SQLite (Local):

```bash
# 1. Install SQLite support
npm install better-sqlite3

# 2. Generate SQLite schema
node scripts/convert-schema-to-sqlite.js

# 3. Create database
sqlite3 arc_raiders.db < database-schema-sqlite.sql

# 4. Set environment
echo "DB_TYPE=sqlite" >> server/.env

# 5. Run server
npm run dev
```

### With Wrangler/D1 (Cloudflare):

```bash
# 1. Install Wrangler
npm install -g wrangler
wrangler login

# 2. Create D1 database
wrangler d1 create arc-raiders-db
# Copy the database_id output

# 3. Update wrangler.toml with your database_id

# 4. Generate SQLite schema (D1 uses SQLite syntax!)
node scripts/convert-schema-to-sqlite.js

# 5. Apply schema to D1
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql

# 6. Deploy
wrangler deploy
```

## What the Converter Does

The script (`scripts/convert-schema-to-sqlite.js`) automatically:

✅ Converts `GENERATED ALWAYS AS IDENTITY` → `AUTOINCREMENT`  
✅ Converts `VARCHAR(n)` → `TEXT`  
✅ Removes `::character varying` type casts  
✅ Converts `BOOLEAN` → `INTEGER`  
✅ Converts `true/false` → `1/0`  
✅ Keeps `TIMESTAMP` → `TEXT` for column types  
✅ Keeps `CURRENT_TIMESTAMP` for DEFAULT values  
✅ Converts `CURRENT_TIMESTAMP` → `datetime('now')` in INSERT statements  
✅ Removes `CASCADE` from DROP statements  
✅ Removes `public.` schema qualifiers  
✅ Removes `USING btree` from indexes  

## Verification

After running the converter, you should have:

```bash
$ node scripts/convert-schema-to-sqlite.js
✅ SQLite schema generated: database-schema-sqlite.sql

To create the database:
  sqlite3 arc_raiders.db < database-schema-sqlite.sql

Or with Wrangler D1:
  wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
```

Check the output:

```bash
$ wc -l database-schema-sqlite.sql
715 database-schema-sqlite.sql

$ grep -c "CREATE TABLE" database-schema-sqlite.sql
17  # All 17 tables converted!
```

## Testing the Schema

### Test with SQLite:

```bash
# Create test database
sqlite3 test.db < database-schema-sqlite.sql

# Verify tables
sqlite3 test.db ".tables"

# Check data
sqlite3 test.db "SELECT COUNT(*) FROM users;"
# Should show: 1  (admin user)

sqlite3 test.db "SELECT COUNT(*) FROM blueprints;"
# Should show: 113  (all blueprints)
```

### Test with Wrangler D1:

```bash
# Apply schema
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql

# Verify
wrangler d1 execute arc-raiders-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check data
wrangler d1 execute arc-raiders-db --command="SELECT COUNT(*) FROM users"
```

## Summary

| Question | Answer |
|----------|--------|
| Does `database-schema.sql` work with SQLite? | ❌ No - PostgreSQL-specific syntax |
| Does `database-schema.sql` work with D1? | ❌ No - Same as SQLite |
| Do I need to manually convert it? | ❌ No - Script does it automatically |
| Will the converter work? | ✅ Yes - Tested and working |
| Is the converted schema compatible? | ✅ Yes - Works with SQLite and D1 |

## Final Answer

**The PostgreSQL schema doesn't work with SQLite/D1, but the converter script I created (`scripts/convert-schema-to-sqlite.js`) automatically generates a compatible version (`database-schema-sqlite.sql`) that works perfectly with both SQLite and Cloudflare D1!**

Just run:
```bash
node scripts/convert-schema-to-sqlite.js
```

And you're good to go! 🎉
