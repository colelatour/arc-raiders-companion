import { verify } from '../utils/jwt.js';

export const authMiddleware = () => async (c, next) => {
  try {
    const authHeader = c.req.header('authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('token='));
      if (match) token = decodeURIComponent(match.split('=')[1]);
    }

    if (!token) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized', message: err.message }, 401);
  }
};

export const requireAdmin = () => async (c, next) => {
  const payload = c.get('jwtPayload') || {};
  const role = payload.role;
  if (role !== 'admin' && role !== 'manager') {
    return c.json({ error: 'Admin or Manager access required' }, 403);
  }
  await next();
};
