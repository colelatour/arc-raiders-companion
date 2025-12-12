/**
 * Server configuration for Cloudflare Workers
 * This is a modified version of server.js that works with Cloudflare Workers
 */

import dbAdapter from './database-adapter.js';

export function createServer(d1Database) {
  // Set D1 database
  dbAdapter.setD1Database(d1Database);
  
  // Return a simple request handler
  return {
    async handleRequest(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      // Handle preflight
      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      try {
        // Health check
        if (path === '/api/health') {
          return new Response(
            JSON.stringify({ status: 'ok', message: 'ARC Raiders API is running on Cloudflare' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Route to appropriate handler
        // TODO: Import and use your existing route handlers here
        // For now, return a simple response
        return new Response(
          JSON.stringify({ message: 'API endpoint not yet implemented in worker' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
        
      } catch (error) {
        console.error('Worker error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
  };
}
