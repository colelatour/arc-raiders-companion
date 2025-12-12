/**
 * Server configuration for Cloudflare Workers
 * This is a modified version of server.js that works with Cloudflare Workers
 */

import dbAdapter from './database.js';
import authRoutes from './routes/auth.js';
import raiderRoutes from './routes/raider.js';
import adminRoutes from './routes/admin.js';

// A simple router to map Express-style routes to Cloudflare handlers
const allRoutes = [];

/**
 * Converts an Express-style path to a regex for matching.
 * e.g., /verify-email/:token -> /^\/verify-email\/([^\/]+)$/
 */
const pathToRegex = (path) => {
  const paramNames = [];
  const regexPath = path.replace(/:(\w+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^\/]+)';
  });
  return {
    regex: new RegExp(`^${regexPath}$`),
    paramNames,
  };
};


const registerRouter = (prefix, router) => {
  for (const route of router) {
    const path = prefix + route.path;
    const method = route.method.toUpperCase();
    const handler = route.handler;
    const { regex, paramNames } = pathToRegex(path);
    allRoutes.push({ path, method, handler, regex, paramNames });
  }
};

registerRouter('/api/auth', authRoutes);
registerRouter('/api/raider', raiderRoutes);
registerRouter('/api/admin', adminRoutes);

export function createServer(env) {
  // Set D1 database
  dbAdapter.setD1Database(env.DB);

  return {
    async handleRequest(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      if (path.startsWith('/api/')) {
        const corsHeaders = {
          'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        };

        if (method === 'OPTIONS') {
          return new Response(null, { headers: corsHeaders });
        }

        try {
          if (path === '/api/health') {
            return new Response(JSON.stringify({ status: 'ok', message: 'ARC Raiders API is running on Cloudflare' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          for (const route of allRoutes) {
            const match = route.regex.exec(path);

            if (match && method === route.method) {
              const params = {};
              if (route.paramNames.length > 0) {
                route.paramNames.forEach((name, index) => {
                  params[name] = match[index + 1];
                });
              }

              const req = {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.method !== 'GET' ? await request.json() : null,
                params: params,
              };

              let responseBody = null;
              let responseStatus = 200;
              const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

              const res = {
                status: (code) => {
                  responseStatus = code;
                  return res;
                },
                json: (body) => {
                  responseBody = JSON.stringify(body);
                  return res;
                },
                send: (body) => {
                  responseBody = body;
                  return res;
                },
                set: (key, value) => {
                  responseHeaders[key] = value;
                  return res;
                },
              };

              await route.handler(req, res);

              return new Response(responseBody, {
                status: responseStatus,
                headers: responseHeaders,
              });
            }
          }

          return new Response(JSON.stringify({ message: `API endpoint not found: ${method} ${path}` }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (error) {
          console.error('Worker error:', error.stack);
          return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Serve static assets
      return env.ASSETS.fetch(request);
    },
  };
}
