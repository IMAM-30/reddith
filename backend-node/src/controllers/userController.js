const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Post, Community, Comment, Vote } = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarma, isModeratorUser } = require('../utils/userTransform');
const {
  relativePathFromFile,
  deleteStorageFile,
} = require('../middleware/upload');
const { batchEnrich } = require('./postController');
const { getBlockedPrivateCommunityIds, postAccessWhere } = require('../utils/communityAccess');

async function show(req, res) {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: assetUrl(user.avatar),
      avatar_url: assetUrl(user.avatar),
      cover: assetUrl(user.cover),
      cover_url: assetUrl(user.cover),
      role: user.role || 'user',
      is_moderator: isModeratorUser(user),
      karma: await calculateKarma(user.id),
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function profile(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    return res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      nim: user.nim,
      font_size_level: user.font_size_level || 0,
      avatar: assetUrl(user.avatar),
      avatar_url: assetUrl(user.avatar),
      cover: assetUrl(user.cover),
      cover_url: assetUrl(user.cover),
      role: user.role || 'user',
      is_moderator: isModeratorUser(user),
      karma: await calculateKarma(user.id),
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { avatar: ['Avatar required.'] },
      });
    }

    if (req.user.avatar) deleteStorageFile(req.user.avatar);

    const path = relativePathFromFile(req.file, 'avatars');
    req.user.avatar = path;
    await req.user.save();

    return res.json({
      message: 'Avatar berhasil diperbarui.',
      avatar: assetUrl(path),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function updateCover(req, res) {
  try {
    if (!req.file) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { cover: ['Sampul required.'] },
      });
    }

    if (req.user.cover) deleteStorageFile(req.user.cover);

    const path = relativePathFromFile(req.file, 'covers');
    req.user.cover = path;
    await req.user.save();

    return res.json({
      message: 'Sampul berhasil diperbarui.',
      cover: assetUrl(path),
      cover_url: assetUrl(path),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, username, nim, font_size_level, password, password_confirmation } = req.body;
    const updates = {};
    const errors = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) errors.name = ['Nama tidak boleh kosong.'];
      else updates.name = cleanName;
    }

    if (username !== undefined) {
      const cleanUsername = String(username).trim();
      if (cleanUsername !== req.user.username) {
        errors.username = ['Username tidak bisa diubah setelah registrasi.'];
      }
    }

    if (nim !== undefined) {
      const cleanNim = String(nim).replace(/\D/g, '');
      if (cleanNim !== req.user.nim) {
        errors.nim = ['NIM tidak bisa diubah setelah registrasi.'];
      }
    }

    if (font_size_level !== undefined) {
      const parsedLevel = Number(font_size_level);
      if (!Number.isInteger(parsedLevel) || parsedLevel < -4 || parsedLevel > 4) {
        errors.font_size_level = ['Ukuran font tidak valid. Pilih level -4 sampai 4.'];
      } else {
        updates.font_size_level = parsedLevel;
      }
    }

    if (password || password_confirmation) {
      if (!password || String(password).length < 6) {
        errors.password = ['Password minimal 6 karakter.'];
      }
      if (password !== password_confirmation) {
        errors.password_confirmation = ['Konfirmasi password tidak cocok.'];
      }
      if (!errors.password && !errors.password_confirmation) {
        updates.password = await bcrypt.hash(password, 10);
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors,
      });
    }

    Object.assign(req.user, updates);
    await req.user.save();

    return res.json({
      message: 'Profil berhasil diperbarui.',
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        nim: req.user.nim,
        font_size_level: req.user.font_size_level,
        avatar: assetUrl(req.user.avatar),
        avatar_url: assetUrl(req.user.avatar),
        cover: assetUrl(req.user.cover),
        cover_url: assetUrl(req.user.cover),
        role: req.user.role || 'user',
        is_moderator: isModeratorUser(req.user),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function userPosts(req, res) {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const page = parseInt(req.query.page) || 1;
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const viewerId = req.user?.id || null;
    const blocked = await getBlockedPrivateCommunityIds(viewerId);
    const accessWhere = postAccessWhere(blocked);
    const baseWhere = { user_id: user.id };
    const where = accessWhere[Op.or]
      ? { [Op.and]: [baseWhere, accessWhere] }
      : baseWhere;

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug', 'icon'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });

    const data = await batchEnrich(rows, req.user?.id || null);

    return res.json({
      current_page: page,
      data,
      from: count === 0 ? null : offset + 1,
      to: count === 0 ? null : offset + rows.length,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      per_page: perPage,
      total: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { show, profile, updateAvatar, updateCover, updateProfile, userPosts };
