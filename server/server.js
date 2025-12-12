import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import raiderRoutes from './routes/raider.js';
import adminRoutes from './routes/admin.js';
import db from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS must be first!
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, only allow specific domain
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [process.env.FRONTEND_URL || 'https://your-production-url.com'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow localhost and local network IPs
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Helper to mount either an Express Router or the worker-style routes array
function mountRoutes(prefix, routesModule) {
  if (!routesModule) return;
  // If it's an Express Router or middleware function, mount directly
  if (typeof routesModule === 'function' || (typeof routesModule === 'object' && routesModule.stack)) {
    app.use(prefix, routesModule);
    return;
  }
  // If it's an array of route descriptors (worker format), convert to Router
  if (Array.isArray(routesModule)) {
    const router = express.Router();
    routesModule.forEach(route => {
      const method = (route.method || 'get').toLowerCase();
      let handler = route.handler;
      const middlewares = [];

      if (handler && handler.stack && Array.isArray(handler.stack)) {
        handler.stack.forEach(m => {
          if (typeof m === 'function') {
            // If function expects (req,res) only, wrap it for Express
            if (m.length < 3) {
              middlewares.push((req, res, next) => {
                try {
                  const ret = m(req, res);
                  Promise.resolve(ret).then(ok => {
                    if (ok === false) return; // middleware signaled halt
                    next();
                  }).catch(next);
                } catch (err) { next(err); }
              });
            } else {
              middlewares.push(m);
            }
          }
        });
      } else if (typeof handler === 'function') {
        if (handler.length < 3) {
          middlewares.push((req, res, next) => {
            try {
              const ret = handler(req, res);
              Promise.resolve(ret).then(ok => {
                if (ok === false) return;
                next();
              }).catch(next);
            } catch (err) { next(err); }
          });
        } else {
          middlewares.push(handler);
        }
      }

      if (typeof router[method] === 'function') {
        router[method](route.path, ...middlewares);
      }
    });
    app.use(prefix, router);
  } else {
    // Fallback
    app.use(prefix, routesModule);
  }
}

// Routes
mountRoutes('/api/auth', authRoutes);
mountRoutes('/api/raider', raiderRoutes);
mountRoutes('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ARC Raiders API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Test database connection before starting server
const startServer = async () => {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`📦 Database type: ${db.getType()}`);
    
    // Test query (works for both SQLite and PostgreSQL)
    const testQuery = db.getType() === 'postgres' 
      ? 'SELECT NOW() as now' 
      : "SELECT datetime('now') as now";
    
    const result = await db.query(testQuery);
    
    console.log('✅ Database connected successfully!');
    console.log(`📅 Database time: ${result.rows[0].now}`);
    
    // Test if tables exist (different query for SQLite vs PostgreSQL)
    let tablesResult;
    if (db.getType() === 'postgres') {
      tablesResult = await db.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
    } else {
      tablesResult = await db.query(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `);
    }
    
    console.log(`📊 Found ${tablesResult.rows[0].count} tables in database`);
    
    // Start server
    const dbInfo = db.getType() === 'postgres'
      ? `${process.env.DB_NAME}@${process.env.DB_HOST}`
      : process.env.SQLITE_DB_PATH || './arc_raiders.db';
    
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🎮 ARC RAIDERS COMPANION API        ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${dbInfo} (${db.getType()})`);
      console.log('');
      console.log('✅ Ready to accept connections!');
      console.log('');
    });
    
  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════╗');
    console.error('║   ❌ DATABASE CONNECTION FAILED       ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('');
    console.error('Error details:', error.message);
    console.error('');
    
    if (db.getType() === 'postgres') {
      console.error('PostgreSQL Troubleshooting:');
      console.error('1. Check if PostgreSQL is running:');
      console.error('   - Mac: brew services list | grep postgresql');
      console.error('   - Linux: pg_isready');
      console.error('');
      console.error('2. Verify database exists:');
      console.error('   psql -l | grep arc_raiders_db');
      console.error('');
      console.error('3. Check credentials in server/.env:');
      console.error(`   DB_HOST=${process.env.DB_HOST}`);
      console.error(`   DB_PORT=${process.env.DB_PORT}`);
      console.error(`   DB_NAME=${process.env.DB_NAME}`);
      console.error(`   DB_USER=${process.env.DB_USER}`);
      console.error('   DB_PASSWORD=****** (check if correct)');
      console.error('');
      console.error('4. Create database if missing:');
      console.error('   createdb arc_raiders_db');
      console.error('   psql -d arc_raiders_db -f ../database-schema.sql');
    } else {
      console.error('SQLite Troubleshooting:');
      console.error('1. Check if database file exists');
      console.error('2. Verify path in server/.env:');
      console.error(`   SQLITE_DB_PATH=${process.env.SQLITE_DB_PATH || './arc_raiders.db'}`);
      console.error('3. Run migrations to create tables');
    }
    console.error('');
    process.exit(1);
  }
};

startServer();
