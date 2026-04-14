const { Vote, Post, Comment, User } = require('../models');
const { createNotification, TYPES } = require('../utils/notification');

async function notifyVote({ voteableType, voteableId, actor, value }) {
  try {
    if (voteableType === Vote.TYPE_POST) {
      const post = await Post.findByPk(voteableId, {
        attributes: ['id', 'user_id', 'title'],
      });
      if (!post || post.user_id === actor.id) return;
      await createNotification({
        userId: post.user_id,
        type: TYPES.VOTE_POST,
        data: {
          actor: { id: actor.id, username: actor.username, avatar: actor.avatar },
          post_id: post.id,
          post_title: post.title,
          value,
        },
      });
    } else if (voteableType === Vote.TYPE_COMMENT) {
      const comment = await Comment.findByPk(voteableId, {
        attributes: ['id', 'user_id', 'post_id', 'body'],
      });
      if (!comment || comment.user_id === actor.id) return;
      const excerpt = (comment.body || '').slice(0, 80);
      await createNotification({
        userId: comment.user_id,
        type: TYPES.VOTE_COMMENT,
        data: {
          actor: { id: actor.id, username: actor.username, avatar: actor.avatar },
          post_id: comment.post_id,
          comment_id: comment.id,
          comment_excerpt: excerpt,
          value,
        },
      });
    }
  } catch (err) {
    console.error('notifyVote error:', err.message);
  }
}

async function toggleVote({ voteableType, voteableId, actor, value }) {
  const existing = await Vote.findOne({
    where: { user_id: actor.id, voteable_type: voteableType, voteable_id: voteableId },
  });

  let shouldNotify = false;

  if (existing) {
    if (existing.value === parseInt(value)) {
      await existing.destroy();
      const score =
        (await Vote.sum('value', {
          where: { voteable_type: voteableType, voteable_id: voteableId },
        })) || 0;
      return { message: 'Vote removed.', score };
    }
    existing.value = parseInt(value);
    await existing.save();
    shouldNotify = true;
  } else {
    await Vote.create({
      user_id: actor.id,
      voteable_type: voteableType,
      voteable_id: voteableId,
      value: parseInt(value),
    });
    shouldNotify = true;
  }

  if (shouldNotify) {
    await notifyVote({ voteableType, voteableId, actor, value: parseInt(value) });
  }

  const score =
    (await Vote.sum('value', {
      where: { voteable_type: voteableType, voteable_id: voteableId },
    })) || 0;
  return { message: 'Voted.', score };
}

async function votePost(req, res) {
  try {
    const value = parseInt(req.body.value);
    if (![1, -1].includes(value)) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { value: ['value harus 1 atau -1.'] },
      });
    }
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    const result = await toggleVote({
      voteableType: Vote.TYPE_POST,
      voteableId: post.id,
      actor: req.user,
      value,
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function voteComment(req, res) {
  try {
    const value = parseInt(req.body.value);
    if (![1, -1].includes(value)) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { value: ['value harus 1 atau -1.'] },
      });
    }
    const comment = await Comment.findByPk(req.params.id);
    if (!comment)
      return res.status(404).json({ message: 'Comment tidak ditemukan.' });

    const result = await toggleVote({
      voteableType: Vote.TYPE_COMMENT,
      voteableId: comment.id,
      actor: req.user,
      value,
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { votePost, voteComment };
