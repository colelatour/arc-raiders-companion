import { Hono } from 'hono';
import { DatabaseAdapter } from './database-adapter.js';
import auth from './routes/auth-worker.js';
import raider from './routes/raider-worker.js';
import admin from './routes/admin-worker.js';

const app = new Hono();
const dbAdapter = new DatabaseAdapter();

// Middleware to initialize database
app.use('*', async (c, next) => {
  if (!dbAdapter.initialized) {
    dbAdapter.setD1Database(c.env.DB);
  }
  await next();
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'ARC Raiders API is running' });
});

app.route('/auth', auth);
app.route('/raider', raider);
app.route('/admin', admin);

export default app;
