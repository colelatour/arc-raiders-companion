import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import raiderRoutes from './routes/raider.js';
import adminRoutes from './routes/admin.js';
import pool from './database.js';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/raider', raiderRoutes);
app.use('/api/admin', adminRoutes);

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
    
    // Test query
    const result = await pool.query('SELECT NOW()');
    
    console.log('✅ Database connected successfully!');
    console.log(`📅 Database time: ${result.rows[0].now}`);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Found ${tablesResult.rows[0].count} tables in database`);
    
    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🎮 ARC RAIDERS COMPANION API        ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
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
    console.error('Troubleshooting steps:');
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
    console.error('');
    process.exit(1);
  }
};

startServer();
