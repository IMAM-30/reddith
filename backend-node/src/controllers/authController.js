const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const { transformUser } = require('../utils/userTransform');

async function register(req, res) {
  try {
    const { name, username, email, password, nim } = req.body;

    // Cek unique
    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { username }, { nim }] },
    });
    if (existing) {
      const errors = {};
      if (existing.email === email) errors.email = ['Email sudah dipakai.'];
      if (existing.username === username)
        errors.username = ['Username sudah dipakai.'];
      if (existing.nim === nim) errors.nim = ['NIM sudah dipakai.'];
      return res
        .status(422)
        .json({ message: 'The given data was invalid.', errors });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      nim,
      password: hashed,
    });

    const token = signToken({ id: user.id });
    const transformed = await transformUser(user);

    return res.status(201).json({ user: transformed, token });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // bcryptjs handles both $2a$ and $2y$ (Laravel) formats
    let stored = user.password;
    // Normalize $2y$ → $2a$ for compatibility (some bcryptjs versions need this)
    if (stored && stored.startsWith('$2y$')) {
      stored = '$2a$' + stored.slice(4);
    }

    const ok = await bcrypt.compare(password, stored);
    if (!ok) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const token = signToken({ id: user.id });
    const transformed = await transformUser(user);
    return res.json({ user: transformed, token });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function me(req, res) {
  try {
    const transformed = await transformUser(req.user);
    return res.json(transformed);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function logout(req, res) {
  // JWT stateless — logout cuma respons sukses, frontend buang token sendiri
  return res.json({ message: 'Logged out.' });
}

module.exports = { register, login, me, logout };
