const { Op } = require('sequelize');
const {
  sequelize,
  Report,
  Post,
  Comment,
  User,
  Community,
  Vote,
} = require('../models');
const { assetUrl } = require('../utils/asset');
const { relativePathFromFile, deleteStorageFile } = require('../middleware/upload');
const { createNotification, TYPES } = require('../utils/notification');
const { isModeratorUser } = require('../utils/userTransform');

const USER_ATTRIBUTES = ['id', 'name', 'username', 'avatar', 'role'];

function requireModerator(req, res) {
  if (!isModeratorUser(req.user)) {
    res.status(403).json({ message: 'Akses moderator diperlukan.' });
    return false;
  }
  return true;
}

function excerpt(text, max = 120) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function publicUser(user) {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.remember_token;
  obj.avatar_url = assetUrl(obj.avatar);
  obj.is_moderator = isModeratorUser(obj);
  return obj;
}

async function findReport(id) {
  return Report.findByPk(id, {
    include: [
      { model: User, as: 'reporter', attributes: USER_ATTRIBUTES },
      { model: User, as: 'targetOwner', attributes: USER_ATTRIBUTES },
      { model: User, as: 'moderator', attributes: USER_ATTRIBUTES },
    ],
  });
}

async function findTarget(targetType, targetId) {
  if (targetType === 'post') {
    const post = await Post.findByPk(targetId, {
      include: [
        { model: User, as: 'user', attributes: USER_ATTRIBUTES },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
      ],
    });
    if (!post) return null;
    return {
      ownerId: post.user_id,
      postId: post.id,
      postTitle: post.title,
      contentExcerpt: excerpt(post.body || post.title),
      instance: post,
    };
  }

  if (targetType === 'comment') {
    const comment = await Comment.findByPk(targetId, {
      include: [
        { model: User, as: 'user', attributes: USER_ATTRIBUTES },
        { model: Post, as: 'post', attributes: ['id', 'title', 'user_id'] },
      ],
    });
    if (!comment) return null;
    return {
      ownerId: comment.user_id,
      postId: comment.post_id,
      postTitle: comment.post?.title || null,
      contentExcerpt: excerpt(comment.body),
      instance: comment,
    };
  }

  return null;
}

async function transformReport(report) {
  if (!report) return null;
  const obj = report.toJSON ? report.toJSON() : { ...report };
  obj.evidence_image_url = assetUrl(obj.evidence_image);
  obj.reporter = publicUser(obj.reporter);
  obj.targetOwner = publicUser(obj.targetOwner);
  obj.moderator = publicUser(obj.moderator);
  obj.target_url = obj.post_id
    ? `/post/${obj.post_id}${obj.target_type === 'comment' ? `#comment-${obj.target_id}` : ''}`
    : null;

  const target = await findTarget(obj.target_type, obj.target_id);
  obj.target_exists = Boolean(target);
  obj.target_summary = target
    ? {
        post_id: target.postId,
        post_title: target.postTitle,
        excerpt: target.contentExcerpt,
      }
    : null;
  return obj;
}

async function store(req, res) {
  const evidencePath = relativePathFromFile(req.file, 'reports');
  try {
    const targetType = String(req.body.target_type || '').trim().toLowerCase();
    const targetId = Number.parseInt(req.body.target_id, 10);
    const reason = String(req.body.reason || '').trim();

    if (!['post', 'comment'].includes(targetType) || !targetId) {
      if (evidencePath) deleteStorageFile(evidencePath);
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { target: ['Target laporan tidak valid.'] },
      });
    }

    if (reason.length < 8) {
      if (evidencePath) deleteStorageFile(evidencePath);
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { reason: ['Alasan laporan minimal 8 karakter.'] },
      });
    }

    const target = await findTarget(targetType, targetId);
    if (!target) {
      if (evidencePath) deleteStorageFile(evidencePath);
      return res.status(404).json({ message: 'Konten yang dilaporkan tidak ditemukan.' });
    }

    const report = await Report.create({
      reporter_id: req.user.id,
      target_type: targetType,
      target_id: targetId,
      target_owner_id: target.ownerId,
      post_id: target.postId,
      reason,
      evidence_image: evidencePath,
    });

    const full = await findReport(report.id);
    return res.status(201).json(await transformReport(full));
  } catch (err) {
    if (evidencePath) deleteStorageFile(evidencePath);
    console.error('report store error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function index(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const status = String(req.query.status || 'pending').toLowerCase();
    const where = status === 'all' ? {} : { status };
    const page = Number.parseInt(req.query.page, 10) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: USER_ATTRIBUTES },
        { model: User, as: 'targetOwner', attributes: USER_ATTRIBUTES },
        { model: User, as: 'moderator', attributes: USER_ATTRIBUTES },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });
    const grouped = await Report.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const summary = grouped.reduce((acc, item) => {
      const value = Number(item.count) || 0;
      acc[item.status] = value;
      acc.total += value;
      return acc;
    }, { pending: 0, resolved: 0, dismissed: 0, total: 0 });

    return res.json({
      current_page: page,
      data: await Promise.all(rows.map(transformReport)),
      from: count === 0 ? null : offset + 1,
      to: count === 0 ? null : offset + rows.length,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      per_page: perPage,
      summary,
      total: count,
    });
  } catch (err) {
    console.error('report index error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function dismiss(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    await report.update({
      status: 'dismissed',
      moderator_id: req.user.id,
      moderator_note: String(req.body.moderator_note || '').trim() || null,
      resolved_at: new Date(),
    });

    const full = await findReport(report.id);
    return res.json(await transformReport(full));
  } catch (err) {
    console.error('report dismiss error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function collectCommentTreeIds(rootId) {
  const ids = [Number(rootId)];
  for (let i = 0; i < ids.length; i += 1) {
    const children = await Comment.findAll({
      where: { parent_id: ids[i] },
      attributes: ['id'],
      raw: true,
    });
    children.forEach((child) => ids.push(Number(child.id)));
  }
  return ids;
}

async function deletePostTarget(post) {
  const comments = await Comment.findAll({
    where: { post_id: post.id },
    attributes: ['id', 'parent_id'],
    raw: true,
  });
  const allIds = new Set(comments.map((c) => Number(c.id)));
  const childrenByParent = new Map();
  comments.forEach((comment) => {
    const parentId = comment.parent_id ? Number(comment.parent_id) : null;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(Number(comment.id));
  });
  const commentIds = [];
  const visit = (id) => {
    (childrenByParent.get(id) || []).forEach(visit);
    commentIds.push(id);
  };
  comments
    .filter((comment) => !comment.parent_id || !allIds.has(Number(comment.parent_id)))
    .forEach((comment) => visit(Number(comment.id)));

  await Vote.destroy({ where: { voteable_type: Vote.TYPE_POST, voteable_id: post.id } });
  if (commentIds.length) {
    await Vote.destroy({
      where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: commentIds } },
    });
    for (const id of commentIds) {
      await Comment.destroy({ where: { id } });
    }
  }
  if (post.image) deleteStorageFile(post.image);
  await post.destroy();
}

async function deleteCommentTarget(comment) {
  const commentIds = await collectCommentTreeIds(comment.id);
  await Vote.destroy({
    where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: commentIds } },
  });
  for (const id of [...commentIds].reverse()) {
    await Comment.destroy({ where: { id } });
  }
}

async function markRelatedReportsResolved(report, moderatorId, note) {
  await Report.update(
    {
      status: 'resolved',
      moderator_id: moderatorId,
      moderator_note: note || null,
      resolved_at: new Date(),
    },
    {
      where: {
        target_type: report.target_type,
        target_id: report.target_id,
        status: 'pending',
      },
    }
  );
}

async function deleteTarget(req, res) {
  try {
    if (!requireModerator(req, res)) return;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const note = String(req.body.moderator_note || '').trim();
    const target = await findTarget(report.target_type, report.target_id);
    if (!target) {
      await report.update({
        status: 'resolved',
        moderator_id: req.user.id,
        moderator_note: note || 'Konten sudah tidak ditemukan.',
        resolved_at: new Date(),
      });
      const full = await findReport(report.id);
      return res.json(await transformReport(full));
    }

    if (report.target_type === 'post') {
      await deletePostTarget(target.instance);
    } else {
      await deleteCommentTarget(target.instance);
    }

    await markRelatedReportsResolved(report, req.user.id, note);

    if (target.ownerId) {
      await createNotification({
        userId: target.ownerId,
        type: TYPES.MODERATION_REMOVED,
        data: {
          target_type: report.target_type,
          report_id: report.id,
          post_id: target.postId,
          post_title: target.postTitle,
          content_excerpt: target.contentExcerpt,
          reason: note || report.reason,
          moderator: {
            id: req.user.id,
            username: req.user.username,
          },
        },
      });
    }

    const full = await findReport(report.id);
    return res.json(await transformReport(full));
  } catch (err) {
    console.error('report delete target error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { store, index, dismiss, deleteTarget };
