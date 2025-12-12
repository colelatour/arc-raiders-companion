-- SQLite Schema Converter Script
-- This Node.js script converts PostgreSQL schema to SQLite compatible schema

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
  
  // Convert TIMESTAMP to TEXT or INTEGER (we'll use TEXT for ISO strings)
  .replace(/TIMESTAMP/g, 'TEXT')
  
  // Convert BOOLEAN to INTEGER (SQLite doesn't have BOOLEAN)
  .replace(/BOOLEAN/g, 'INTEGER')
  
  // Fix DEFAULT values for booleans
  .replace(/DEFAULT true/g, 'DEFAULT 1')
  .replace(/DEFAULT false/g, 'DEFAULT 0')
  .replace(/DEFAULT TRUE/g, 'DEFAULT 1')
  .replace(/DEFAULT FALSE/g, 'DEFAULT 0')
  
  // Remove USING btree from index definitions
  .replace(/USING btree/g, '')
  
  // Convert CREATE INDEX to work with SQLite (remove ON public)
  .replace(/CREATE (UNIQUE )?INDEX (\w+) ON public\.(\w+)/g, 'CREATE $1INDEX $2 ON $3')
  
  // Fix CURRENT_TIMESTAMP to datetime('now') for better compatibility
  .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")
  
  // Remove extra whitespace
  .replace(/\n\n+/g, '\n\n');

// Write the SQLite schema
fs.writeFileSync('./database-schema-sqlite.sql', sqliteSchema);

console.log('✅ SQLite schema generated: database-schema-sqlite.sql');
console.log('\nTo create the database:');
console.log('  sqlite3 arc_raiders.db < database-schema-sqlite.sql');
