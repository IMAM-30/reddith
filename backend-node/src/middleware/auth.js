const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

// Required: harus login, kalau tidak return 401
async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }
}

// Optional: kalau ada token & valid, set req.user. Kalau tidak, lanjut tanpa user.
async function authOptional(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (user) req.user = user;
  } catch (e) {
    // ignore
  }
  next();
}

module.exports = { authRequired, authOptional };
