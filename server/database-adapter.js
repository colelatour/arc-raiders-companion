/**
 * Database Adapter - Unified interface for Cloudflare D1
 */

export class DatabaseAdapter {
  constructor() {
    this.dbType = 'd1';
    this.db = null;
    this.initialized = false;
    this.initializedPromise = new Promise(resolve => {
      this.resolveInitializedPromise = resolve;
    });
  }

  async initialize() {
    // Initialization is handled by setD1Database
    return;
  }

  /**
   * Execute a query with parameters
   */
  async query(sql, params = []) {
    await this.initializedPromise;
    if (!this.initialized) {
      throw new Error('Database not initialized. Call setD1Database first.');
    }
    return this.queryD1(sql, params);
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
    this.resolveInitializedPromise();
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
      const boundStmt = stmt.bind(...params);

      // Execute query
      const result = await boundStmt.all();
      
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
   * Close the database connection (no-op for D1)
   */
  async close() {
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