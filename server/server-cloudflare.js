import express from 'express';
import dbAdapter from './database.js';
import authRoutes from './routes/auth.js';
import raiderRoutes from './routes/raider.js';
import adminRoutes from './routes/admin.js';

export function createServer(env) {
  const app = express();

  // Set D1 database
  dbAdapter.setD1Database(env.DB);

  // Middleware to handle JSON body parsing
  app.use(express.json());
  
  // CORS middleware
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', env.FRONTEND_URL || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    next();
  });

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/raider', raiderRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ARC Raiders API is running on Cloudflare' });
  });

  return {
    async handleRequest(request, env, ctx) {
      // Monkey-patch request and response objects to be Express-compatible
      const req = request;
      req.body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};
      
      const res = {
        _status: 200,
        _headers: {},
        status(code) {
          this._status = code;
          return this;
        },
        json(data) {
          this.set('Content-Type', 'application/json');
          this.send(JSON.stringify(data));
        },
        send(data) {
          this._body = data;
        },
        set(key, value) {
          this._headers[key] = value;
        }
      };

      try {
        // Find matching route and execute
        let match = false;
        for (const layer of app._router.stack) {
          if (layer.route && request.url.match(layer.route.path)) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            if (methods.includes(request.method)) {
              match = true;
              // Attach params
              const pathRegex = new RegExp(layer.route.path.replace(/:(\w+)/g, '(?<$1>[^\\/]+)'));
              const matchResult = pathRegex.exec(new URL(request.url).pathname);
              req.params = matchResult?.groups || {};

              // Run middleware and handler
              await new Promise((resolve, reject) => {
                const next = (err) => {
                  if (err) reject(err);
                  else resolve();
                };
                
                const handlers = layer.handle.stack || [layer.handle];
                
                const run = (index = 0) => {
                  if (index >= handlers.length) return resolve();
                  try {
                    handlers[index](req, res, (err) => {
                      if (err) reject(err);
                      else run(index + 1);
                    });
                  } catch (e) {
                    reject(e);
                  }
                };
                
                run();
              });

              break;
            }
          }
        }
        
        if (!match) {
          // Fallback to a 404 if no API route matches
          const url = new URL(request.url);
          if (url.pathname.startsWith('/api/')) {
            res.status(404).json({ message: `API endpoint not found: ${request.method} ${url.pathname}` });
          } else {
             // Serve static assets
            return env.ASSETS.fetch(request);
          }
        }

      } catch (error) {
        console.error('Worker error:', error.stack);
        res.status(500).json({ error: 'Internal server error', message: error.message });
      }

      return new Response(res._body, {
        status: res._status,
        headers: res._headers,
      });
    }
  };
}
