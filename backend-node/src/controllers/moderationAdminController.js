const { Op } = require('sequelize');
const {
  User,
  Community,
  CommunityUser,
  Post,
  Comment,
  Vote,
  DirectMessage,
  Notification,
  Report,
} = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarmaBatch, isModeratorUser } = require('../utils/userTransform');
const {
  withCleanupTransaction,
  deletePostById,
  deleteCommentsByIds,
  deleteCommunityById,
  deleteUserById,
} = require('../utils/moderationCleanup');

const USER_ATTRIBUTES = ['id', 'name', 'username', 'email', 'nim', 'avatar', 'cover', 'role', 'created_at', 'updated_at'];

function requireModerator(req, res) {
  if (!isModeratorUser(req.user)) {
    res.status(403).json({ message: 'Akses moderator diperlukan.' });
    return false;
  }
  return true;
}

function paging(req) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(50, Math.max(5, Number.parseInt(req.query.per_page, 10) || 20));
  return { page, perPage, offset: (page - 1) * perPage };
}

function pageResponse({ rows, count, page, perPage, data }) {
  return {
    current_page: page,
    data,
    from: count === 0 ? null : (page - 1) * perPage + 1,
    to: count === 0 ? null : (page - 1) * perPage + rows.length,
    last_page: Math.max(1, Math.ceil(count / perPage)),
    per_page: perPage,
    total: count,
  };
}

function userPayload(user, karma = 0) {
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.remember_token;
  obj.avatar_url = assetUrl(obj.avatar);
  obj.cover_url = assetUrl(obj.cover);
  obj.is_moderator = isModeratorUser(obj);
  obj.karma = karma;
  return obj;
}

async function dashboard(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const [users, communities, posts, comments, reports, pendingReports, messages, notifications] = await Promise.all([
      User.count(),
      Community.count(),
      Post.count(),
      Comment.count(),
      Report.count(),
      Report.count({ where: { status: 'pending' } }),
      DirectMessage.count(),
      Notification.count(),
    ]);
    return res.json({
      users,
      communities,
      posts,
      comments,
      reports,
      pending_reports: pendingReports,
      direct_messages: messages,
      notifications,
    });
  } catch (err) {
    console.error('moderation dashboard error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function users(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const { page, perPage, offset } = paging(req);
    const q = String(req.query.q || '').trim();
    const where = q
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { username: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
            { nim: { [Op.like]: `%${q}%` } },
          ],
        }
      : {};

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: USER_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });
    const ids = rows.map((user) => user.id);
    const [karmaMap, postRows, commentRows, communityRows] = await Promise.all([
      calculateKarmaBatch(ids),
      ids.length ? Post.findAll({ where: { user_id: { [Op.in]: ids } }, attributes: ['user_id'], raw: true }) : [],
      ids.length ? Comment.findAll({ where: { user_id: { [Op.in]: ids } }, attributes: ['user_id'], raw: true }) : [],
      ids.length ? Community.findAll({ where: { user_id: { [Op.in]: ids } }, attributes: ['user_id'], raw: true }) : [],
    ]);

    const countBy = (items, key) => items.reduce((acc, item) => {
      const id = Number(item[key]);
      acc.set(id, (acc.get(id) || 0) + 1);
      return acc;
    }, new Map());
    const postMap = countBy(postRows, 'user_id');
    const commentMap = countBy(commentRows, 'user_id');
    const communityMap = countBy(communityRows, 'user_id');

    const data = rows.map((row) => ({
      ...userPayload(row, karmaMap.get(row.id) || 0),
      posts_count: postMap.get(Number(row.id)) || 0,
      comments_count: commentMap.get(Number(row.id)) || 0,
      communities_count: communityMap.get(Number(row.id)) || 0,
    }));

    return res.json(pageResponse({ rows, count, page, perPage, data }));
  } catch (err) {
    console.error('moderation users error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function communities(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const { page, perPage, offset } = paging(req);
    const q = String(req.query.q || '').trim();
    const where = q
      ? { [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { slug: { [Op.like]: `%${q}%` } }] }
      : {};
    const { rows, count } = await Community.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });
    const ids = rows.map((community) => community.id);
    const [members, posts] = await Promise.all([
      ids.length ? CommunityUser.findAll({ where: { community_id: { [Op.in]: ids } }, attributes: ['community_id'], raw: true }) : [],
      ids.length ? Post.findAll({ where: { community_id: { [Op.in]: ids } }, attributes: ['community_id'], raw: true }) : [],
    ]);
    const countByCommunity = (items) => items.reduce((acc, item) => {
      const id = Number(item.community_id);
      acc.set(id, (acc.get(id) || 0) + 1);
      return acc;
    }, new Map());
    const memberMap = countByCommunity(members);
    const postMap = countByCommunity(posts);
    const data = rows.map((row) => {
      const obj = row.toJSON();
      obj.icon_url = assetUrl(obj.icon);
      obj.cover_url = assetUrl(obj.cover);
      if (obj.creator) obj.creator.avatar_url = assetUrl(obj.creator.avatar);
      obj.members_count = memberMap.get(Number(row.id)) || 0;
      obj.posts_count = postMap.get(Number(row.id)) || 0;
      return obj;
    });

    return res.json(pageResponse({ rows, count, page, perPage, data }));
  } catch (err) {
    console.error('moderation communities error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function posts(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const { page, perPage, offset } = paging(req);
    const q = String(req.query.q || '').trim();
    const where = q
      ? { [Op.or]: [{ title: { [Op.like]: `%${q}%` } }, { body: { [Op.like]: `%${q}%` } }] }
      : {};
    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });
    const ids = rows.map((post) => post.id);
    const [commentRows, voteRows, reportRows] = await Promise.all([
      ids.length ? Comment.findAll({ where: { post_id: { [Op.in]: ids } }, attributes: ['post_id'], raw: true }) : [],
      ids.length ? Vote.findAll({ where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: ids } }, attributes: ['voteable_id', 'value'], raw: true }) : [],
      ids.length ? Report.findAll({ where: { post_id: { [Op.in]: ids } }, attributes: ['post_id'], raw: true }) : [],
    ]);
    const commentMap = commentRows.reduce((acc, item) => acc.set(Number(item.post_id), (acc.get(Number(item.post_id)) || 0) + 1), new Map());
    const reportMap = reportRows.reduce((acc, item) => acc.set(Number(item.post_id), (acc.get(Number(item.post_id)) || 0) + 1), new Map());
    const voteMap = voteRows.reduce((acc, item) => acc.set(Number(item.voteable_id), (acc.get(Number(item.voteable_id)) || 0) + Number(item.value || 0)), new Map());

    const data = rows.map((row) => {
      const obj = row.toJSON();
      obj.image_url = assetUrl(obj.image);
      if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
      obj.comments_count = commentMap.get(Number(row.id)) || 0;
      obj.reports_count = reportMap.get(Number(row.id)) || 0;
      obj.votes_sum_value = voteMap.get(Number(row.id)) || 0;
      return obj;
    });

    return res.json(pageResponse({ rows, count, page, perPage, data }));
  } catch (err) {
    console.error('moderation posts error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function comments(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const { page, perPage, offset } = paging(req);
    const q = String(req.query.q || '').trim();
    const where = q ? { body: { [Op.like]: `%${q}%` } } : {};
    const { rows, count } = await Comment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });
    const ids = rows.map((comment) => comment.id);
    const [voteRows, reportRows] = await Promise.all([
      ids.length ? Vote.findAll({ where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: ids } }, attributes: ['voteable_id', 'value'], raw: true }) : [],
      ids.length ? Report.findAll({ where: { target_type: 'comment', target_id: { [Op.in]: ids } }, attributes: ['target_id'], raw: true }) : [],
    ]);
    const reportMap = reportRows.reduce((acc, item) => acc.set(Number(item.target_id), (acc.get(Number(item.target_id)) || 0) + 1), new Map());
    const voteMap = voteRows.reduce((acc, item) => acc.set(Number(item.voteable_id), (acc.get(Number(item.voteable_id)) || 0) + Number(item.value || 0)), new Map());
    const data = rows.map((row) => {
      const obj = row.toJSON();
      if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
      obj.reports_count = reportMap.get(Number(row.id)) || 0;
      obj.votes_sum_value = voteMap.get(Number(row.id)) || 0;
      return obj;
    });

    return res.json(pageResponse({ rows, count, page, perPage, data }));
  } catch (err) {
    console.error('moderation comments error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function destroyUser(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const result = await withCleanupTransaction((transaction) => deleteUserById(req.params.id, req.user.id, transaction));
    return res.json({ message: 'User dan seluruh jejak kontennya dihapus.', deleted: result });
  } catch (err) {
    console.error('moderation delete user error:', err);
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function destroyCommunity(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const result = await withCleanupTransaction((transaction) => deleteCommunityById(req.params.id, transaction));
    return res.json({ message: 'Komunitas dan seluruh kontennya dihapus.', deleted: result });
  } catch (err) {
    console.error('moderation delete community error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function destroyPost(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const result = await withCleanupTransaction((transaction) => deletePostById(req.params.id, transaction));
    return res.json({ message: 'Postingan, komentar, vote, dan laporan terkait dihapus.', deleted: result });
  } catch (err) {
    console.error('moderation delete post error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function destroyComment(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const result = await withCleanupTransaction((transaction) => deleteCommentsByIds([req.params.id], transaction));
    return res.json({ message: 'Komentar, balasan, vote, dan laporan terkait dihapus.', deleted: result });
  } catch (err) {
    console.error('moderation delete comment error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  dashboard,
  users,
  communities,
  posts,
  comments,
  destroyUser,
  destroyCommunity,
  destroyPost,
  destroyComment,
};
