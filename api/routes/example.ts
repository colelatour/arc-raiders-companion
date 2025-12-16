// src/routes/example.ts
import { Hono } from 'hono';
import { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' });
});

app.get('/users/first', async (c) => {
  const db = c.env.DB;
  try {
    const { results } = await db.prepare('SELECT * FROM users LIMIT 1').all();
    if (!results || results.length === 0) {
      return c.json({ error: 'No users found in the database.' }, 404);
    }
    return c.json(results[0]);
  } catch (error: any) {
    console.error('D1 Error:', error.message);
    return c.json({ error: 'Failed to query database' }, 500);
  }
});

export default app;
