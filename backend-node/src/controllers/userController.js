const { Op } = require('sequelize');
const { User, Post, Community, Comment, Vote } = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarma } = require('../utils/userTransform');
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
      avatar: assetUrl(user.avatar),
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

async function updateProfile(req, res) {
  try {
    const { name, username } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) {
      const exists = await User.findOne({
        where: { username, id: { [Op.ne]: req.user.id } },
      });
      if (exists) {
        return res.status(422).json({
          message: 'The given data was invalid.',
          errors: { username: ['Username sudah dipakai.'] },
        });
      }
      updates.username = username;
    }

    Object.assign(req.user, updates);
    await req.user.save();

    return res.json({
      message: 'Profil berhasil diperbarui.',
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        avatar: assetUrl(req.user.avatar),
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

module.exports = { show, profile, updateAvatar, updateProfile, userPosts };
