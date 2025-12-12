import { Hono } from 'hono';
import { DatabaseAdapter } from './database-adapter.js';
import { hashPassword } from './utils/crypto.js'; // Import hashPassword
import dbAdapter from './database.js'; // Import dbAdapter directly
import auth from './routes/auth-worker.js';
import raider from './routes/raider-worker.js';
import admin from './routes/admin-worker.js';

const app = new Hono();
const myDbAdapter = new DatabaseAdapter(); // Rename to avoid conflict with imported dbAdapter

// Middleware to initialize database
app.use('*', async (c, next) => {
  if (!myDbAdapter.initialized) { // Use myDbAdapter
    myDbAdapter.setD1Database(c.env.DB);
  }
  await next();
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'ARC Raiders API is running' });
});

// Temporarily add register route directly to app for debugging
app.post('/api/auth/register', async (c) => {
  const { email, username, password } = await c.req.json();

  try {
    if (!email || !username || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const existingUser = await myDbAdapter.query( // Use myDbAdapter
      'SELECT * FROM users WHERE email = ?1 OR username = ?2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }

    const passwordHash = await hashPassword(password);

    // TODO: email verification is not implemented yet in the worker
    const result = await myDbAdapter.query( // Use myDbAdapter
      `INSERT INTO users (email, username, password_hash, role, email_verified) 
       VALUES (?1, ?2, ?3, 'user', true) 
       RETURNING id, email, username, role, created_at, email_verified`,
      [email, username, passwordHash]
    );

    const newUser = result.rows[0];

    return c.json({
      message: 'Registration successful!',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        emailVerified: newUser.email_verified
      }
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Server error during registration' }, 500);
  }
});

// app.route('/api/auth', auth); // Temporarily commented out
app.route('/api/raider', raider);
app.route('/api/admin', admin);

export default app;
