import { Hono } from 'hono';
import { DatabaseAdapter } from './database-adapter.js';
import auth from './routes/auth-worker.js';
import raider from './routes/raider-worker.js';
import admin from './routes/admin-worker.js';

const app = new Hono();
const dbAdapter = new DatabaseAdapter(); // Revert to dbAdapter name

// Middleware to initialize database
app.use('*', async (c, next) => {
  if (!dbAdapter.initialized) {
    dbAdapter.setD1Database(c.env.DB);
  }
  await next();
});

app.get('/health', (c) => { // Removed /api prefix
  return c.json({ status: 'ok', message: 'ARC Raiders API is running' });
});

app.route('/auth', auth); // Removed /api prefix
app.route('/raider', raider); // Removed /api prefix
app.route('/admin', admin); // Removed /api prefix

export default app;
