import { Hono } from 'hono';
import { sign, verify } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import dbAdapter from '../database.js';

const auth = new Hono();

//TODO: a robust solution for email verification should be implemented using a service like Mailgun or SendGrid, as Nodemailer is not compatible with Cloudflare Workers.

auth.post('/register', async (c) => {
  const { email, username, password } = await c.req.json();

  try {
    if (!email || !username || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const existingUser = await dbAdapter.query(
      'SELECT * FROM users WHERE email = ?1 OR username = ?2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }

    const passwordHash = await hashPassword(password);

    // TODO: email verification is not implemented yet in the worker
    const result = await dbAdapter.query(
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

auth.post('/login', async (c) => {
    const { email, password } = await c.req.json();

    try {
      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      const result = await dbAdapter.query(
        'SELECT * FROM users WHERE email = ?1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      const user = result.rows[0];

      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      await dbAdapter.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?1',
        [user.id]
      );

      const token = await sign(
        { userId: user.id, email: user.email, username: user.username, role: user.role || 'user', exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
        c.env.JWT_SECRET,
      );

      return c.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role || 'user',
          theme: user.theme || 'dark'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Server error during login' }, 500);
    }
});

auth.get('/verify', async (c) => {
    const authHeader = c.req.header('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return c.json({ error: 'No token provided' }, 401);
    }

    try {
        const decoded = await verify(token, c.env.JWT_SECRET);
        
        const result = await dbAdapter.query(
        'SELECT id, email, username, role, theme FROM users WHERE id = ?1 AND is_active = true',
        [decoded.userId]
        );

        if (result.rows.length === 0) {
        return c.json({ error: 'User not found' }, 401);
        }

        const user = result.rows[0];
        return c.json({ 
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            theme: user.theme || 'dark'
        }
        });

    } catch (error) {
        return c.json({ error: 'Invalid token' }, 403);
    }
});

export default auth;
