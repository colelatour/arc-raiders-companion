function createApp() {
  const app = { _router: { stack: [] } };
  const METHODS = ['get','post','put','delete','patch','options'];
  app.use = function(a,b){
    if(typeof a === 'string' && b){
      const prefix = a;
      const handler = b;
      if(Array.isArray(handler)) {
        handler.forEach(route => {
          const method = route.method.toLowerCase();
          app._router.stack.push({ route: { path: prefix + route.path, methods: { [method]: true } }, handle: route.handler });
        });
      } else if (typeof handler === 'function' || typeof handler === 'object') {
        app._router.stack.push({ route: { path: prefix, methods: { get:true,post:true,put:true,delete:true,patch:true,options:true } }, handle: handler });
      }
    } else if (typeof a === 'function') {
      app._router.stack.push({ route: { path: '.*', methods: { get:true,post:true,put:true,delete:true,patch:true,options:true } }, handle: a });
    } else if (Array.isArray(a)) {
      a.forEach(route => {
        const method = route.method.toLowerCase();
        app._router.stack.push({ route: { path: route.path, methods: { [method]: true } }, handle: route.handler });
      });
    }
  };
  METHODS.forEach(m => {
    app[m] = function(path, handler){
      app._router.stack.push({ route: { path, methods: { [m]: true } }, handle: handler });
    };
  });
  return app;
}

import dbAdapter from './database.js';
import authRoutes from './routes/auth.js';
import raiderRoutes from './routes/raider.js';
import adminRoutes from './routes/admin.js';

export function createServer(env) {
  const app = createApp();

  // Set D1 database
  dbAdapter.setD1Database(env.DB);

  // Middleware to handle JSON body parsing
  
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

  // Respond to favicon requests with no content to avoid asset 500s when no favicon is uploaded
  app.get('/favicon.ico', (req, res) => {
    res.status(204).send('');
  });

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
                
                const run = async (index = 0) => {
                  if (index >= handlers.length) return resolve();
                  try {
                    const ret = handlers[index](req, res, (err) => {
                      if (err) reject(err);
                      else run(index + 1);
                    });

                    // If middleware returned a Promise (e.g., authenticateToken), await it
                    if (ret && typeof ret.then === 'function') {
                      const result = await ret;
                      // If middleware signals to stop by returning false, resolve the chain
                      if (result === false) return resolve();
                      // Otherwise continue to next handler
                      return run(index + 1);
                    }

                    // If the handler does not accept a next callback (length < 3), assume it handled the response and continue
                    if (typeof handlers[index] === 'function' && handlers[index].length < 3) {
                      return run(index + 1);
                    }
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
