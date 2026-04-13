const { Op, fn, col } = require('sequelize');
const { Comment, Post, User, Vote } = require('../models');
const { assetUrl } = require('../utils/asset');

// Single-comment enrich (dipakai store endpoint)
async function transformComment(c, userId = null) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : { ...c };
  if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
  obj.votes_sum_value =
    (await Vote.sum('value', {
      where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: obj.id },
    })) || 0;
  if (userId) {
    const v = await Vote.findOne({
      where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: obj.id, user_id: userId },
      attributes: ['value'],
    });
    obj.user_vote = v ? v.value : 0;
  } else {
    obj.user_vote = 0;
  }
  return obj;
}

// Batch enrich semua comment sekaligus (flat list → vote data)
async function batchEnrichFlat(flatRows, userId = null) {
  const allIds = flatRows.map((r) => r.id);
  if (!allIds.length) return flatRows;

  const [voteRows, myVoteRows] = await Promise.all([
    Vote.findAll({
      where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: allIds } },
      attributes: ['voteable_id', [fn('SUM', col('value')), 'total']],
      group: ['voteable_id'],
      raw: true,
    }),
    userId
      ? Vote.findAll({
          where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: allIds }, user_id: userId },
          attributes: ['voteable_id', 'value'],
          raw: true,
        })
      : Promise.resolve([]),
  ]);

  const voteMap = new Map(voteRows.map((r) => [parseInt(r.voteable_id), parseInt(r.total)]));
  const myVoteMap = new Map(myVoteRows.map((r) => [parseInt(r.voteable_id), parseInt(r.value)]));

  return flatRows.map((c) => {
    const obj = c.toJSON ? c.toJSON() : { ...c };
    if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
    obj.votes_sum_value = voteMap.get(obj.id) || 0;
    obj.user_vote = myVoteMap.get(obj.id) || 0;
    return obj;
  });
}

// Build nested tree dari flat list
function buildCommentTree(flatComments) {
  const map = new Map();
  const roots = [];

  // Pass 1: index semua comment, init replies array
  flatComments.forEach((c) => {
    c.replies = [];
    map.set(c.id, c);
  });

  // Pass 2: pasang ke parent masing-masing
  flatComments.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
}

async function index(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    // Fetch semua comment untuk post ini (flat), lalu build tree di JS
    const allComments = await Comment.findAll({
      where: { post_id: post.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
      order: [['created_at', 'ASC']],
    });

    const enriched = await batchEnrichFlat(allComments, req.user?.id || null);
    const tree = buildCommentTree(enriched);

    // Paginate hanya top-level roots
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;
    const paginatedRoots = tree.slice(offset, offset + perPage);

    return res.json({
      current_page: page,
      data: paginatedRoots,
      from: tree.length === 0 ? null : offset + 1,
      to: tree.length === 0 ? null : offset + paginatedRoots.length,
      last_page: Math.max(1, Math.ceil(tree.length / perPage)),
      per_page: perPage,
      total: tree.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function store(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    const { body, parent_id } = req.body;
    if (!body || body.trim() === '') {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { body: ['Body required.'] },
      });
    }

    if (parent_id) {
      const parent = await Comment.findByPk(parent_id);
      if (!parent || parent.post_id !== post.id) {
        return res.status(422).json({
          message: 'The given data was invalid.',
          errors: { parent_id: ['Parent comment tidak ditemukan.'] },
        });
      }
    }

    const comment = await Comment.create({
      user_id: req.user.id,
      post_id: post.id,
      parent_id: parent_id || null,
      body,
    });

    const full = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
    });
    return res.status(201).json(await transformComment(full, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function destroy(req, res) {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment)
      return res.status(404).json({ message: 'Comment tidak ditemukan.' });

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Cascade: hapus semua child replies rekursif
    async function deleteChildren(parentId) {
      const children = await Comment.findAll({ where: { parent_id: parentId } });
      for (const child of children) {
        await deleteChildren(child.id);
        await child.destroy();
      }
    }
    await deleteChildren(comment.id);
    await comment.destroy();

    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { index, store, destroy };
