// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';
import { Bindings } from '../index';

// This is the primary JWT middleware. It verifies the token and adds the payload to the context.
// Any route using this middleware will require a valid Bearer token in the Authorization header.
export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });
  return jwtMiddleware(c, next);
});

// This middleware checks if the user has the 'admin' role.
// It should be used *after* the authMiddleware on routes that require admin privileges.
export const adminMiddleware = createMiddleware<{ Variables: { jwtPayload: { role: string } } }>(async (c, next) => {
  const payload = c.get('jwtPayload');

  if (!payload || payload.role !== 'admin') {
    return c.json({ error: 'Forbidden: Administrator access required.' }, 403);
  }

  await next();
});
