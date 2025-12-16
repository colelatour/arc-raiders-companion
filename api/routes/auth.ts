// src/routes/auth.ts
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';
import { Bindings } from '../index';
import { authMiddleware } from '../middleware/auth';
import { Context } from 'hono';

const app = new Hono<{ Bindings: Bindings }>();

app.post('/register', async (c) => {
  const { email, username, password } = await c.req.json();
  const db = c.env.DB;

  if (!email || !username || !password) {
    return c.json({ error: 'All fields are required' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters long' }, 400);
  }

  try {
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?1 OR username = ?2'
    ).bind(email, username).first();

    if (existingUser) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?1, ?2, ?3)'
    ).bind(email, username, passwordHash).run();

    return c.json({ message: 'Registration successful! You can now log in.' }, 201);

  } catch (error: any) {
    console.error('Registration error:', error.message);
    return c.json({ error: 'Server error during registration.' }, 500);
  }
});

app.post('/login', async (c) => {
    const { email, password } = await c.req.json();
    const db = c.env.DB;

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
    }

    try {
        const user = await db.prepare(
            'SELECT id, username, email, password_hash, role, theme FROM users WHERE email = ?1 AND is_active = true'
        ).bind(email).first<{ id: number; username: string; email: string; password_hash: string; role: string; theme: string }>();

        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        await db.prepare(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?1'
        ).bind(user.id).run();

        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role || 'user',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        };
        const token = await sign(payload, c.env.JWT_SECRET);

        return c.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role || 'user',
                theme: user.theme || 'dark',
            },
        });

    } catch (error: any) {
        console.error('Login error:', error.message);
        return c.json({ error: 'Server error during login' }, 500);
    }
});

app.get('/verify', authMiddleware, (c: Context) => {
  const payload = c.get('jwtPayload');
  return c.json({ user: payload }, 200);
});

export default app;

