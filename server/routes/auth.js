
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database.js';
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } from '../utils/emailService.js';


const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: async (req, res) => {
      const { email, username, password } = req.body;

      try {
        // Validate input
        if (!email || !username || !password) {
          return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1 OR username = $2',
          [email, username]
        );

        if (existingUser.rows.length > 0) {
          return res.status(409).json({ error: 'Email or username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user with verification fields
        const result = await pool.query(
          `INSERT INTO users (email, username, password_hash, role, email_verified, verification_token, verification_token_expires) 
           VALUES ($1, $2, $3, 'user', false, $4, $5) 
           RETURNING id, email, username, role, created_at, email_verified`,
          [email, username, passwordHash, verificationToken, tokenExpires]
        );

        const newUser = result.rows[0];

        // Send verification email
        try {
          await sendVerificationEmail(email, username, verificationToken);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Continue registration even if email fails
        }

        res.status(201).json({
          message: 'Registration successful! Please check your email to verify your account.',
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            emailVerified: newUser.email_verified
          }
        });

      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
      }
    }
  },
  {
    method: 'POST',
    path: '/login',
    handler: async (req, res) => {
      const { email, password } = req.body;

      try {
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1 AND is_active = true',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if email is verified
        if (!user.email_verified) {
          return res.status(403).json({ 
            error: 'Please verify your email address before logging in. Check your email for the verification link.' 
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );

        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email, username: user.username, role: user.role || 'user' },
          (typeof process !== 'undefined' && process.env && process.env.JWT_SECRET) || (req && req.env && req.env.JWT_SECRET),
          { expiresIn: '7d' }
        );

        res.json({
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
        res.status(500).json({ error: 'Server error during login' });
      }
    }
  },
  {
    method: 'GET',
    path: '/verify',
    handler: async (req, res) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      try {
        const decoded = jwt.verify(token, (typeof process !== 'undefined' && process.env && process.env.JWT_SECRET) || (req && req.env && req.env.JWT_SECRET));
        
        const result = await pool.query(
          'SELECT id, email, username, role, theme FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({ 
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            theme: user.theme || 'dark'
          }
        });

      } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
      }
    }
  },
  {
    method: 'GET',
    path: '/verify-email/:token',
    handler: async (req, res) => {
      const { token } = req.params;

      try {
        // Find user with this verification token
        const result = await pool.query(
          `SELECT id, email, username, verification_token_expires, email_verified 
           FROM users 
           WHERE verification_token = $1 AND is_active = true`,
          [token]
        );

        if (result.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid verification token' });
        }

        const user = result.rows[0];

        // Check if already verified
        if (user.email_verified) {
          return res.status(400).json({ error: 'Email already verified. You can log in now.' });
        }

        // Check if token expired
        if (new Date() > new Date(user.verification_token_expires)) {
          return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        }

        // Update user as verified and clear token
        await pool.query(
          `UPDATE users 
           SET email_verified = true, 
               verification_token = NULL, 
               verification_token_expires = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [user.id]
        );

        // Create default raider profile
        await pool.query(
          `INSERT INTO raider_profiles (user_id, raider_name, expedition_level) 
           VALUES ($1, $2, 0)`,
          [user.id, user.username]
        );

        // Send welcome email
        try {
          await sendWelcomeEmail(user.email, user.username);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }

        res.json({ 
          message: 'Email verified successfully! You can now log in.',
          verified: true
        });

      } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Server error during email verification' });
      }
    }
  },
  {
    method: 'POST',
    path: '/resend-verification',
    handler: async (req, res) => {
      const { email } = req.body;

      try {
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        // Find user
        const result = await pool.query(
          'SELECT id, email, username, email_verified FROM users WHERE email = $1 AND is_active = true',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Check if already verified
        if (user.email_verified) {
          return res.status(400).json({ error: 'Email already verified. You can log in now.' });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        await pool.query(
          `UPDATE users 
           SET verification_token = $1, 
               verification_token_expires = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [verificationToken, tokenExpires, user.id]
        );

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationToken);

        res.json({ 
          message: 'Verification email sent! Please check your inbox.',
          sent: true
        });

      } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Server error sending verification email' });
      }
    }
  }
];

export default routes;