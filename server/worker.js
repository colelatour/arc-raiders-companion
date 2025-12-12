/**
 * Cloudflare Worker for ARC Raiders Companion API
 * 
 * This worker integrates with Cloudflare D1 database
 * and serves as the production API endpoint.
 * 
 * Setup:
 * 1. Create a D1 database: wrangler d1 create arc-raiders-db
 * 2. Run migrations: wrangler d1 execute arc-raiders-db --file=./migrations/schema.sql
 * 3. Update wrangler.toml with your D1 database ID
 * 4. Deploy: wrangler deploy
 */

import { createServer } from './server/server-cloudflare.js';

export default {
  async fetch(request, env, ctx) {
    // Get the Express-like app with D1 database binding
    const app = createServer(env.DB);
    
    // Handle the request
    return await app.handleRequest(request, env, ctx);
  }
};
