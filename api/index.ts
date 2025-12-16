// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import authRoutes from './routes/auth';
import raiderRoutes from './routes/raider';
import adminRoutes from './routes/admin';

// Define the environment bindings that are available to the worker.
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  // If you have other bindings, like R2 or KV, add them here.
  // MY_BUCKET: R2Bucket;
};

// Initialize Hono with the correct binding types
const app = new Hono<{ Bindings: Bindings }>();

// --- Middleware ---

// Add CORS middleware to allow requests from your frontend
app.use('/api/*', cors({
  origin: (origin) => {
    // In a real app, you'd want a more restrictive list of origins.
    // For local dev, this allows all origins.
    // e.g., return ['https://your-pages-project.pages.dev', 'http://localhost:5173'].includes(origin) ? origin : null;
    return origin; 
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));


// --- Public Routes ---

// Health check route
app.get('/api', (c) => {
  return c.json({ ok: true, message: 'ARC Raiders Companion API is running' });
});


// --- API Routes ---

// Register the modularized routes
app.route('/api/auth', authRoutes);
app.route('/api/raider', raiderRoutes);
app.route('/api/admin', adminRoutes);


// --- Error Handling ---

// Catch-all for 404s
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Global error handler
app.onError((err, c) => {
  // TODO: Add more robust error logging/reporting (e.g., Sentry)
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
