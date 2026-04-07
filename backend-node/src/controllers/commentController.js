const { Comment, Post, User, Vote } = require('../models');
const { assetUrl } = require('../utils/asset');

async function transformComment(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : { ...c };
  if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
  obj.votes_sum_value =
    (await Vote.sum('value', {
      where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: obj.id },
    })) || 0;
  if (obj.replies && Array.isArray(obj.replies)) {
    obj.replies = await Promise.all(
      obj.replies.map(async (r) => {
        if (r.user) r.user.avatar_url = assetUrl(r.user.avatar);
        r.votes_sum_value =
          (await Vote.sum('value', {
            where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: r.id },
          })) || 0;
        return r;
      })
    );
  }
  return obj;
}

async function index(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Comment.findAndCountAll({
      where: { post_id: post.id, parent_id: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'username', 'avatar'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
      distinct: true,
    });

    const data = await Promise.all(rows.map(transformComment));

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
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    const { body, parent_id } = req.body;
    if (!body || body.trim() === '') {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { body: ['Body required.'] },
      });
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
    return res.status(201).json(await transformComment(full));
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
    await comment.destroy();
    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { index, store, destroy };
