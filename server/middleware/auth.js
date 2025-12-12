import jwt from 'jsonwebtoken';

// authenticateToken supports both Cloudflare Worker (req.headers.get) and Express (req.headers object)
export const authenticateToken = (req, res, next) => {
  const isExpress = typeof next === 'function';

  const getAuthHeader = () => {
    if (isExpress) {
      return (req.headers && (req.headers.authorization || req.headers['authorization'])) || null;
    }
    if (req && req.headers && typeof req.headers.get === 'function') {
      return req.headers.get('authorization');
    }
    return (req.headers && (req.headers.authorization || req.headers['authorization'])) || null;
  };

  const authHeader = getAuthHeader();
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    if (isExpress) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    res.status(401).json({ error: 'Access token required' });
    return false;
  }

  const verify = () => new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        if (isExpress) res.status(403).json({ error: 'Invalid or expired token' });
        else res.status(403).json({ error: 'Invalid or expired token' });
        return resolve(false);
      }
      req.user = user;
      resolve(true);
    });
  });

  if (isExpress) {
    verify().then(ok => { if (ok === false) return; next(); }).catch(err => next(err));
  } else {
    return verify();
  }
};
