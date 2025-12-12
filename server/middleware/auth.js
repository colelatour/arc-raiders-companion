import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return false;
  }

  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        resolve(false);
      } else {
        req.user = user;
        resolve(true);
      }
    });
  });
};
