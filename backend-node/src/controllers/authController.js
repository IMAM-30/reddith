const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const { transformUser } = require('../utils/userTransform');

function isAccepted(value) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'on';
}

async function register(req, res) {
  try {
    const { name, username, email, password, nim } = req.body;
    const cleanName = String(name || '').trim();
    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNim = String(nim || '').replace(/\D/g, '');
    const cleanPassword = String(password || '');
    const passwordConfirmation = req.body.password_confirmation;
    const rulesRead = isAccepted(req.body.rules_read);
    const rulesFollow = isAccepted(req.body.rules_follow);
    const errors = {};

    if (!cleanName) errors.name = ['Nama lengkap wajib diisi.'];
    if (!cleanUsername) errors.username = ['Nama pengguna wajib diisi.'];
    if (!cleanEmail) errors.email = ['Email wajib diisi.'];
    if (!cleanNim) {
      errors.nim = ['NIM wajib diisi.'];
    } else if (!/^\d{9}$/.test(cleanNim)) {
      errors.nim = ['NIM harus 9 digit angka.'];
    }
    if (!cleanPassword) {
      errors.password = ['Kata sandi wajib diisi.'];
    }
    if (passwordConfirmation !== undefined && cleanPassword !== passwordConfirmation) {
      errors.password_confirmation = ['Konfirmasi kata sandi tidak cocok.'];
    }
    if (!rulesRead) errors.rules_read = ['Anda harus menyatakan sudah membaca peraturan.'];
    if (!rulesFollow) errors.rules_follow = ['Anda harus menyetujui untuk mengikuti peraturan.'];

    if (Object.keys(errors).length > 0) {
      return res
        .status(422)
        .json({ message: 'The given data was invalid.', errors });
    }

    const existingUsers = await User.findAll({
      where: { [Op.or]: [{ email: cleanEmail }, { username: cleanUsername }, { nim: cleanNim }] },
    });
    for (const existing of existingUsers) {
      if (existing.email === cleanEmail) errors.email = ['Email sudah dipakai.'];
      if (existing.username === cleanUsername) errors.username = ['Nama pengguna sudah dipakai.'];
      if (existing.nim === cleanNim) {
        errors.nim = ['NIM sudah digunakan oleh akun lain. Satu NIM hanya bisa dipakai untuk satu pengguna.'];
      }
    }
    if (Object.keys(errors).length > 0) {
      return res
        .status(422)
        .json({ message: 'The given data was invalid.', errors });
    }

    const hashed = await bcrypt.hash(cleanPassword, 10);
    const user = await User.create({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      nim: cleanNim,
      password: hashed,
    });

    const token = signToken({ id: user.id });
    const transformed = await transformUser(user);

    return res.status(201).json({ user: transformed, token });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const errors = {};
      for (const item of err.errors || []) {
        if (item.path === 'email') errors.email = ['Email sudah dipakai.'];
        if (item.path === 'username') errors.username = ['Nama pengguna sudah dipakai.'];
        if (item.path === 'nim') {
          errors.nim = ['NIM sudah digunakan oleh akun lain. Satu NIM hanya bisa dipakai untuk satu pengguna.'];
        }
      }
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: Object.keys(errors).length ? errors : { general: ['Data akun sudah digunakan.'] },
      });
    }
    console.error('register error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { identifier, email, password } = req.body;
    const id = (identifier || email || '').trim();
    if (!id || !password) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: {
          identifier: !id ? ['Email / Username / NIM required.'] : undefined,
          password: !password ? ['Password required.'] : undefined,
        },
      });
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ email: id }, { username: id }, { nim: id }] },
    });
    if (!user) {
      return res.status(401).json({ message: 'Kredensial salah.' });
    }

    // bcryptjs handles both $2a$ and $2y$ (Laravel) formats
    let stored = user.password;
    if (stored && stored.startsWith('$2y$')) {
      stored = '$2a$' + stored.slice(4);
    }

    const ok = await bcrypt.compare(password, stored);
    if (!ok) {
      return res.status(401).json({ message: 'Kredensial salah.' });
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
