const { Op, fn, col, literal } = require('sequelize');
const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const {
  Community,
  CommunityUser,
  Post,
  User,
  sequelize,
} = require('../models');
const { paginate } = require('../utils/paginate');
const { assetUrl } = require('../utils/asset');
const { relativePathFromFile, deleteStorageFile } = require('../middleware/upload');

function transformCommunity(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : { ...c };
  obj.icon_url = assetUrl(obj.icon);
  return obj;
}

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Community.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    // Tambah members_count & posts_count manual
    const data = await Promise.all(
      rows.map(async (c) => {
        const obj = transformCommunity(c);
        obj.members_count = await CommunityUser.count({
          where: { community_id: c.id },
        });
        obj.posts_count = await Post.count({ where: { community_id: c.id } });
        return obj;
      })
    );

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

async function store(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res
        .status(422)
        .json({ message: 'The given data was invalid.', errors: { name: ['Name is required.'] } });
    }

    const slug = slugify(name);

    // Cek unique nama & slug
    const exists = await Community.findOne({
      where: { [Op.or]: [{ name }, { slug }] },
    });
    if (exists) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { name: ['Nama community sudah dipakai.'] },
      });
    }

    const iconPath = relativePathFromFile(req.file, 'communities');

    const community = await Community.create({
      user_id: req.user.id,
      name,
      slug,
      description: description || null,
      icon: iconPath,
    });

    // Creator auto-join
    await CommunityUser.findOrCreate({
      where: { community_id: community.id, user_id: req.user.id },
    });

    const withCreator = await Community.findByPk(community.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'username'] }],
    });

    return res.status(201).json(transformCommunity(withCreator));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function show(req, res) {
  try {
    const community = await Community.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
      ],
    });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    const obj = transformCommunity(community);
    obj.members_count = await CommunityUser.count({
      where: { community_id: community.id },
    });
    obj.posts_count = await Post.count({ where: { community_id: community.id } });

    // Cek apakah user yang sedang login sudah member
    obj.is_member = false;
    if (req.user) {
      const membership = await CommunityUser.findOne({
        where: { community_id: community.id, user_id: req.user.id },
      });
      obj.is_member = !!membership;
    }

    return res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function join(req, res) {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    await CommunityUser.findOrCreate({
      where: { community_id: community.id, user_id: req.user.id },
    });
    return res.json({ message: 'Joined community.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function leave(req, res) {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    await CommunityUser.destroy({
      where: { community_id: community.id, user_id: req.user.id },
    });
    return res.json({ message: 'Left community.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Community yang sudah di-join oleh user yang login
async function myCommunities(req, res) {
  try {
    const memberships = await CommunityUser.findAll({
      where: { user_id: req.user.id },
      attributes: ['community_id'],
    });
    const ids = memberships.map((m) => m.community_id);
    if (ids.length === 0) return res.json([]);

    const communities = await Community.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['name', 'ASC']],
    });

    const data = await Promise.all(
      communities.map(async (c) => {
        const obj = transformCommunity(c);
        obj.members_count = await CommunityUser.count({ where: { community_id: c.id } });
        return obj;
      })
    );

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// Community yang di-join oleh user tertentu (berdasarkan username)
async function userCommunities(req, res) {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const memberships = await CommunityUser.findAll({
      where: { user_id: user.id },
      attributes: ['community_id'],
    });
    const ids = memberships.map((m) => m.community_id);
    if (ids.length === 0) return res.json([]);

    const communities = await Community.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['name', 'ASC']],
    });

    const data = await Promise.all(
      communities.map(async (c) => {
        const obj = transformCommunity(c);
        obj.members_count = await CommunityUser.count({ where: { community_id: c.id } });
        return obj;
      })
    );

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { index, store, show, join, leave, myCommunities, userCommunities, transformCommunity };
