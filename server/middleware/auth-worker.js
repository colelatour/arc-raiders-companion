import { jwt } from 'hono/jwt';

export const authMiddleware = () => async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });
  return jwtMiddleware(c, next);
};

export const requireAdmin = () => async (c, next) => {
    const payload = c.get('jwtPayload');
    const role = payload.role;

    if (role !== 'admin' && role !== 'manager') {
        return c.json({ error: 'Admin or Manager access required' }, 403);
    }

    await next();
};
