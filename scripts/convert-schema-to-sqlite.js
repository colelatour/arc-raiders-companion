// SQLite Schema Converter Script
// This Node.js script converts PostgreSQL schema to SQLite compatible schema

import fs from 'fs';
import path from 'path';

const postgresSchema = fs.readFileSync('./database-schema.sql', 'utf8');

// Convert PostgreSQL syntax to SQLite
let sqliteSchema = postgresSchema
  // Remove CASCADE
  .replace(/CASCADE/g, '')
  
  // Convert GENERATED ALWAYS AS IDENTITY to AUTOINCREMENT
  .replace(/INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  
  // Remove schema qualifications
  .replace(/public\./g, '')
  
  // Convert VARCHAR to TEXT (SQLite uses TEXT for strings)
  .replace(/VARCHAR\(\d+\)/g, 'TEXT')
  
  // Remove type casts like ::character varying
  .replace(/::\w+(\s+varying)?/g, '')
  
  // Protect CURRENT_TIMESTAMP by replacing it temporarily
  .replace(/CURRENT_TIMESTAMP/g, '###CURRENT_TS###')
  
  // NOW we can safely convert TIMESTAMP type to TEXT
  .replace(/TIMESTAMP/g, 'TEXT')
  
  // Restore CURRENT_TIMESTAMP for DEFAULT clauses (SQLite supports this)
  .replace(/DEFAULT ###CURRENT_TS###/g, 'DEFAULT CURRENT_TIMESTAMP')
  
  // For INSERT statements, convert to datetime('now')
  .replace(/,\s*###CURRENT_TS###\s*,/g, ", datetime('now'),")
  .replace(/,\s*###CURRENT_TS###\s*\)/g, ", datetime('now'))")
  .replace(/\(\s*###CURRENT_TS###\s*,/g, "(datetime('now'),")
  
  // Any remaining ###CURRENT_TS### (shouldn't be any, but just in case)
  .replace(/###CURRENT_TS###/g, 'CURRENT_TIMESTAMP')
  
  // Convert BOOLEAN to INTEGER (SQLite doesn't have BOOLEAN)
  .replace(/BOOLEAN/g, 'INTEGER')
  
  // Fix DEFAULT values for booleans
  .replace(/DEFAULT true/g, 'DEFAULT 1')
  .replace(/DEFAULT false/g, 'DEFAULT 0')
  .replace(/DEFAULT TRUE/g, 'DEFAULT 1')
  .replace(/DEFAULT FALSE/g, 'DEFAULT 0')
  
  // Fix standalone TRUE/FALSE in INSERT statements
  .replace(/,\s*TRUE\s*,/g, ', 1,')
  .replace(/,\s*FALSE\s*,/g, ', 0,')
  .replace(/,\s*TRUE\s*\)/g, ', 1)')
  .replace(/,\s*FALSE\s*\)/g, ', 0)')
  .replace(/\(\s*TRUE\s*,/g, '(1,')
  .replace(/\(\s*FALSE\s*,/g, '(0,')
  
  // Remove USING btree from index definitions
  .replace(/USING btree/g, '')
  
  // Convert CREATE INDEX to work with SQLite (remove ON public)
  .replace(/CREATE (UNIQUE )?INDEX (\w+) ON public\.(\w+)/g, 'CREATE $1INDEX $2 ON $3')
  
  // Remove extra whitespace
  .replace(/\n\n+/g, '\n\n');

// Write the SQLite schema
fs.writeFileSync('./database-schema-sqlite.sql', sqliteSchema);

console.log('✅ SQLite schema generated: database-schema-sqlite.sql');
console.log('\nTo create the database:');
console.log('  sqlite3 arc_raiders.db < database-schema-sqlite.sql');
console.log('\nOr with Wrangler D1:');
console.log('  wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql');
