const { Op } = require('sequelize');
const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const { Community, CommunityUser, Post, User } = require('../models');
const { assetUrl } = require('../utils/asset');
const { relativePathFromFile, deleteStorageFile } = require('../middleware/upload');
const { calculateKarma, calculateKarmaBatch } = require('../utils/userTransform');
const { createNotification, TYPES } = require('../utils/notification');

function transformCommunity(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : { ...c };
  obj.icon_url = assetUrl(obj.icon);
  return obj;
}

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Community.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    const ids = rows.map((c) => c.id);
    const [memberCounts, postCounts, myMemberships] = await Promise.all([
      ids.length
        ? CommunityUser.findAll({
            where: { community_id: { [Op.in]: ids }, status: 'active' },
            attributes: ['community_id'],
            raw: true,
          })
        : [],
      ids.length
        ? Post.findAll({
            where: { community_id: { [Op.in]: ids } },
            attributes: ['community_id'],
            raw: true,
          })
        : [],
      req.user && ids.length
        ? CommunityUser.findAll({
            where: { community_id: { [Op.in]: ids }, user_id: req.user.id },
            attributes: ['community_id', 'status'],
            raw: true,
          })
        : [],
    ]);

    const memberMap = new Map();
    memberCounts.forEach((r) => {
      memberMap.set(parseInt(r.community_id), (memberMap.get(parseInt(r.community_id)) || 0) + 1);
    });
    const postMap = new Map();
    postCounts.forEach((r) => {
      postMap.set(parseInt(r.community_id), (postMap.get(parseInt(r.community_id)) || 0) + 1);
    });
    const myMap = new Map(myMemberships.map((r) => [parseInt(r.community_id), r.status]));

    const data = rows.map((c) => {
      const obj = transformCommunity(c);
      obj.members_count = memberMap.get(c.id) || 0;
      obj.posts_count = postMap.get(c.id) || 0;
      obj.membership_status = myMap.get(c.id) || null;
      obj.is_member = obj.membership_status === 'active';
      obj.is_owner = !!(req.user && c.user_id === req.user.id);
      return obj;
    });

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
    const { name, description, visibility, min_karma } = req.body;

    if (!name || name.trim() === '') {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { name: ['Name is required.'] },
      });
    }

    const slug = slugify(name);
    const exists = await Community.findOne({
      where: { [Op.or]: [{ name }, { slug }] },
    });
    if (exists) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { name: ['Nama community sudah dipakai.'] },
      });
    }

    const vis = visibility === 'private' ? 'private' : 'public';
    const minK = Math.max(0, parseInt(min_karma) || 0);

    const iconPath = relativePathFromFile(req.file, 'communities');

    const community = await Community.create({
      user_id: req.user.id,
      name,
      slug,
      description: description || null,
      icon: iconPath,
      visibility: vis,
      min_karma: minK,
    });

    await CommunityUser.findOrCreate({
      where: { community_id: community.id, user_id: req.user.id },
      defaults: { status: 'active' },
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
        { model: User, as: 'creator', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
    });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    const obj = transformCommunity(community);
    if (obj.creator) obj.creator.avatar_url = assetUrl(obj.creator.avatar);
    obj.members_count = await CommunityUser.count({
      where: { community_id: community.id, status: 'active' },
    });
    obj.posts_count = await Post.count({ where: { community_id: community.id } });
    obj.is_owner = !!(req.user && community.user_id === req.user.id);

    obj.membership_status = null;
    obj.is_member = false;
    if (req.user) {
      const membership = await CommunityUser.findOne({
        where: { community_id: community.id, user_id: req.user.id },
      });
      if (membership) {
        obj.membership_status = membership.status;
        obj.is_member = membership.status === 'active';
      }
    }

    return res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function join(req, res) {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    if (community.user_id === req.user.id) {
      return res.status(422).json({ message: 'Kamu adalah pemilik community ini.' });
    }

    const existing = await CommunityUser.findOne({
      where: { community_id: community.id, user_id: req.user.id },
    });
    if (existing) {
      if (existing.status === 'active') {
        return res.status(422).json({ message: 'Kamu sudah tergabung.', membership_status: 'active' });
      }
      return res.status(422).json({ message: 'Permintaan join kamu masih menunggu persetujuan.', membership_status: 'pending' });
    }

    if (community.min_karma > 0) {
      const karma = await calculateKarma(req.user.id);
      if (karma < community.min_karma) {
        return res.status(422).json({
          message: `Butuh minimal ${community.min_karma} karma untuk bergabung. Karma kamu: ${karma}.`,
          required_karma: community.min_karma,
          current_karma: karma,
        });
      }
    }

    const isPrivate = community.visibility === 'private';
    const status = isPrivate ? 'pending' : 'active';

    await CommunityUser.create({
      community_id: community.id,
      user_id: req.user.id,
      status,
    });

    const actor = { id: req.user.id, username: req.user.username, avatar: req.user.avatar };
    await createNotification({
      userId: community.user_id,
      type: isPrivate ? TYPES.COMMUNITY_REQUEST : TYPES.COMMUNITY_JOIN,
      data: {
        actor,
        community_id: community.id,
        community_slug: community.slug,
        community_name: community.name,
      },
    });

    return res.json({
      message: isPrivate ? 'Permintaan join terkirim.' : 'Berhasil bergabung.',
      membership_status: status,
      is_member: status === 'active',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function leave(req, res) {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    if (community.user_id === req.user.id) {
      return res.status(422).json({ message: 'Pemilik tidak bisa keluar dari community sendiri.' });
    }

    await CommunityUser.destroy({
      where: { community_id: community.id, user_id: req.user.id },
    });
    return res.json({ message: 'Left community.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function myCommunities(req, res) {
  try {
    const memberships = await CommunityUser.findAll({
      where: { user_id: req.user.id, status: 'active' },
      attributes: ['community_id'],
    });
    const ids = memberships.map((m) => m.community_id);
    if (ids.length === 0) return res.json([]);

    const communities = await Community.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['name', 'ASC']],
    });

    const counts = await CommunityUser.findAll({
      where: { community_id: { [Op.in]: ids }, status: 'active' },
      attributes: ['community_id'],
      raw: true,
    });
    const countMap = new Map();
    counts.forEach((r) => {
      countMap.set(parseInt(r.community_id), (countMap.get(parseInt(r.community_id)) || 0) + 1);
    });

    const data = communities.map((c) => {
      const obj = transformCommunity(c);
      obj.members_count = countMap.get(c.id) || 0;
      return obj;
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function userCommunities(req, res) {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const memberships = await CommunityUser.findAll({
      where: { user_id: user.id, status: 'active' },
      attributes: ['community_id'],
    });
    const memberIds = memberships.map((m) => m.community_id);

    const ownedCommunities = await Community.findAll({
      where: { user_id: user.id },
      attributes: ['id'],
      raw: true,
    });
    const ownedIds = ownedCommunities.map((c) => c.id);

    const allIds = Array.from(new Set([...memberIds, ...ownedIds]));
    if (allIds.length === 0) return res.json([]);

    const communities = await Community.findAll({
      where: { id: { [Op.in]: allIds } },
      order: [['name', 'ASC']],
    });

    const counts = await CommunityUser.findAll({
      where: { community_id: { [Op.in]: allIds }, status: 'active' },
      attributes: ['community_id'],
      raw: true,
    });
    const countMap = new Map();
    counts.forEach((r) => {
      countMap.set(parseInt(r.community_id), (countMap.get(parseInt(r.community_id)) || 0) + 1);
    });

    const data = communities.map((c) => {
      const obj = transformCommunity(c);
      obj.members_count = countMap.get(c.id) || 0;
      obj.is_owner = c.user_id === user.id;
      return obj;
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// ── Owner-only endpoints ──────────────────────────────────

async function assertOwner(req, res) {
  const community = await Community.findOne({ where: { slug: req.params.slug } });
  if (!community) {
    res.status(404).json({ message: 'Community tidak ditemukan.' });
    return null;
  }
  if (community.user_id !== req.user.id) {
    res.status(403).json({ message: 'Hanya pemilik community yang bisa melakukan aksi ini.' });
    return null;
  }
  return community;
}

async function updateSettings(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const { visibility, min_karma, description, remove_icon } = req.body;
    const updates = {};
    if (visibility === 'public' || visibility === 'private') {
      updates.visibility = visibility;
    }
    if (min_karma !== undefined) {
      const n = parseInt(min_karma);
      if (Number.isNaN(n) || n < 0) {
        return res.status(422).json({ message: 'min_karma harus angka >= 0.' });
      }
      updates.min_karma = n;
    }
    if (description !== undefined) {
      updates.description = description || null;
    }

    if (req.file) {
      if (community.icon) deleteStorageFile(community.icon);
      updates.icon = relativePathFromFile(req.file, 'communities');
    } else if (remove_icon === '1' || remove_icon === 'true' || remove_icon === true) {
      if (community.icon) deleteStorageFile(community.icon);
      updates.icon = null;
    }

    Object.assign(community, updates);
    await community.save();

    return res.json({
      message: 'Settings updated.',
      community: transformCommunity(community),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function members(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const rows = await CommunityUser.findAll({
      where: { community_id: community.id, status: 'active' },
      order: [['created_at', 'ASC']],
    });
    const userIds = rows.map((r) => r.user_id);
    if (!userIds.length) return res.json([]);

    const [users, karmaMap] = await Promise.all([
      User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'name', 'username', 'avatar'] }),
      calculateKarmaBatch(userIds),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = rows.map((r) => {
      const u = userMap.get(r.user_id);
      return {
        user_id: r.user_id,
        username: u?.username,
        name: u?.name,
        avatar_url: assetUrl(u?.avatar),
        karma: karmaMap.get(r.user_id) || 0,
        joined_at: r.created_at,
        is_owner: r.user_id === community.user_id,
      };
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function requests(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const rows = await CommunityUser.findAll({
      where: { community_id: community.id, status: 'pending' },
      order: [['created_at', 'ASC']],
    });
    const userIds = rows.map((r) => r.user_id);
    if (!userIds.length) return res.json([]);

    const [users, karmaMap] = await Promise.all([
      User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'name', 'username', 'avatar'] }),
      calculateKarmaBatch(userIds),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = rows.map((r) => {
      const u = userMap.get(r.user_id);
      return {
        user_id: r.user_id,
        username: u?.username,
        name: u?.name,
        avatar_url: assetUrl(u?.avatar),
        karma: karmaMap.get(r.user_id) || 0,
        requested_at: r.created_at,
      };
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function approveRequest(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const userId = parseInt(req.params.userId);
    const row = await CommunityUser.findOne({
      where: { community_id: community.id, user_id: userId, status: 'pending' },
    });
    if (!row) return res.status(404).json({ message: 'Request tidak ditemukan.' });

    row.status = 'active';
    await row.save();

    await createNotification({
      userId,
      type: TYPES.COMMUNITY_APPROVED,
      data: {
        community_id: community.id,
        community_slug: community.slug,
        community_name: community.name,
      },
    });

    return res.json({ message: 'Request disetujui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function rejectRequest(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const userId = parseInt(req.params.userId);
    const row = await CommunityUser.findOne({
      where: { community_id: community.id, user_id: userId, status: 'pending' },
    });
    if (!row) return res.status(404).json({ message: 'Request tidak ditemukan.' });

    await row.destroy();

    await createNotification({
      userId,
      type: TYPES.COMMUNITY_REJECTED,
      data: {
        community_id: community.id,
        community_slug: community.slug,
        community_name: community.name,
      },
    });

    return res.json({ message: 'Request ditolak.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function kickMember(req, res) {
  try {
    const community = await assertOwner(req, res);
    if (!community) return;

    const userId = parseInt(req.params.userId);
    if (userId === community.user_id) {
      return res.status(422).json({ message: 'Tidak bisa mengeluarkan pemilik.' });
    }

    const row = await CommunityUser.findOne({
      where: { community_id: community.id, user_id: userId, status: 'active' },
    });
    if (!row) return res.status(404).json({ message: 'Member tidak ditemukan.' });

    await row.destroy();
    return res.json({ message: 'Member dikeluarkan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  index,
  store,
  show,
  join,
  leave,
  myCommunities,
  userCommunities,
  transformCommunity,
  updateSettings,
  members,
  requests,
  approveRequest,
  rejectRequest,
  kickMember,
};
