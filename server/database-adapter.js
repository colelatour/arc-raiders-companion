/**
 * Database Adapter - Unified interface for SQLite/D1 and PostgreSQL
 * 
 * This adapter provides a consistent API regardless of the underlying database.
 * Set DB_TYPE environment variable to 'sqlite' or 'postgres' (default: postgres)
 */

class DatabaseAdapter {
  constructor() {
    // Check if we're in a Cloudflare Worker environment
    const isCloudflare = typeof process === 'undefined' || typeof process.env === 'undefined';
    
    this.dbType = isCloudflare ? 'd1' : (process?.env?.DB_TYPE || 'postgres');
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Skip initialization for D1 - it will be set via setD1Database()
    if (this.dbType === 'd1') {
      return;
    }

    if (this.dbType === 'sqlite') {
      await this.initializeSQLite();
    } else {
      await this.initializePostgres();
    }

    this.initialized = true;
  }

  async initializeSQLite() {
    // Only initialize SQLite in Node.js/local environments
    if (typeof process === 'undefined') {
      throw new Error('SQLite initialization is not supported in Cloudflare Workers.');
    }

    // Build module name dynamically to avoid bundlers resolving it
    const modName = String.fromCharCode(98,101,116,116,101,114,45,115,113,108,105,116,101,51); // 'better-sqlite3'
    const sqliteMod = await import(modName).catch(() => null);
    if (!sqliteMod) {
      throw new Error('better-sqlite3 module not available in this environment');
    }

    const Database = sqliteMod.default;
    const dbPath = process.env.SQLITE_DB_PATH || './arc_raiders.db';
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    console.log(`✅ Connected to SQLite database: ${dbPath}`);
  }

  async initializePostgres() {
    // Only run Postgres initialization in Node.js (local) environments.
    if (typeof process === 'undefined') {
      throw new Error('Postgres initialization is not supported in Cloudflare Workers.');
    }

    // Use eval to avoid bundlers statically resolving the 'pg' module during worker builds
    const pg = await import('pg').catch(() => null);
    if (!pg) {
      throw new Error('Postgres module not available in this environment');
    }
    const { Pool } = pg.default;

    const poolConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' 
            ? { rejectUnauthorized: false }
            : false
        }
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
        };

    this.db = new Pool(poolConfig);

    this.db.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });

    this.db.on('error', (err) => {
      console.error('❌ Unexpected database error:', err);
      process.exit(-1);
    });
  }

  /**
   * Execute a query with parameters
   * Automatically converts between PostgreSQL ($1, $2) and SQLite (?, ?) syntax
   */
  async query(sql, params = []) {
    await this.initialize();

    if (this.dbType === 'd1') {
      return this.queryD1(sql, params);
    } else if (this.dbType === 'sqlite') {
      return this.querySQLite(sql, params);
    } else {
      return this.queryPostgres(sql, params);
    }
  }

  async querySQLite(sql, params = []) {
    // Convert PostgreSQL placeholder syntax ($1, $2) to SQLite (?, ?)
    let sqliteSQL = sql;
    const sortedParams = [];
    
    // Find all $n placeholders and replace with ?
    const matches = sql.match(/\$\d+/g);
    if (matches) {
      const uniqueMatches = [...new Set(matches)].sort((a, b) => {
        return parseInt(a.substring(1)) - parseInt(b.substring(1));
      });
      
      uniqueMatches.forEach((match, index) => {
        const paramIndex = parseInt(match.substring(1)) - 1;
        sortedParams.push(params[paramIndex]);
        sqliteSQL = sqliteSQL.replace(new RegExp('\\' + match, 'g'), '?');
      });
    }

    const finalParams = sortedParams.length > 0 ? sortedParams : params;

    try {
      // Handle SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sqliteSQL);
        const rows = stmt.all(...finalParams);
        return { rows, rowCount: rows.length };
      }
      
      // Handle INSERT/UPDATE/DELETE with RETURNING clause
      if (sqliteSQL.toUpperCase().includes('RETURNING')) {
        // SQLite doesn't support RETURNING, so we need to handle it differently
        const returningMatch = sqliteSQL.match(/RETURNING\s+(.+)$/i);
        const returningCols = returningMatch ? returningMatch[1].trim() : '*';
        
        // Remove RETURNING clause for SQLite
        const insertSQL = sqliteSQL.replace(/RETURNING\s+.+$/i, '').trim();
        
        const stmt = this.db.prepare(insertSQL);
        const info = stmt.run(...finalParams);
        
        // Fetch the inserted/updated row
        if (info.lastInsertRowid) {
          const selectSQL = `SELECT ${returningCols} FROM ${this.extractTableName(insertSQL)} WHERE rowid = ?`;
          const selectStmt = this.db.prepare(selectSQL);
          const rows = selectStmt.all(info.lastInsertRowid);
          return { rows, rowCount: rows.length };
        }
        
        return { rows: [], rowCount: info.changes };
      }
      
      // Handle other queries (INSERT, UPDATE, DELETE)
      const stmt = this.db.prepare(sqliteSQL);
      const info = stmt.run(...finalParams);
      
      return { 
        rows: [], 
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid 
      };
    } catch (error) {
      console.error('SQLite Query Error:', error);
      console.error('SQL:', sqliteSQL);
      console.error('Params:', finalParams);
      throw error;
    }
  }

  async queryPostgres(sql, params = []) {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      console.error('PostgreSQL Query Error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  extractTableName(sql) {
    const match = sql.match(/(?:INSERT INTO|UPDATE|FROM)\s+(\w+)/i);
    return match ? match[1] : 'users';
  }

  /**
   * For Cloudflare D1 integration
   * Pass the D1 database binding from the Cloudflare Worker
   */
  setD1Database(d1Database) {
    this.dbType = 'd1';
    this.db = d1Database;
    this.initialized = true;
    console.log('✅ Using Cloudflare D1 database');
  }

  async queryD1(sql, params = []) {
    // Convert $1, $2 to ?1, ?2 for D1
    let d1SQL = sql;
    params.forEach((_, index) => {
      d1SQL = d1SQL.replace(`$${index + 1}`, `?${index + 1}`);
    });

    try {
      const stmt = this.db.prepare(d1SQL);
      
      // Bind parameters
      params.forEach((param, index) => {
        stmt.bind(param);
      });

      // Execute query
      const result = await stmt.all();
      
      return {
        rows: result.results || [],
        rowCount: result.results?.length || 0
      };
    } catch (error) {
      console.error('D1 Query Error:', error);
      console.error('SQL:', d1SQL);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (!this.initialized) return;

    if (this.dbType === 'postgres') {
      await this.db.end();
    } else if (this.dbType === 'sqlite') {
      this.db.close();
    }
    
    this.initialized = false;
  }

  /**
   * Get the underlying database instance
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Get database type
   */
  getType() {
    return this.dbType;
  }
}

// Export singleton instance
const dbAdapter = new DatabaseAdapter();
export default dbAdapter;
