const { Vote, Post, Comment } = require('../models');

async function toggleVote({ voteableType, voteableId, userId, value }) {
  const existing = await Vote.findOne({
    where: { user_id: userId, voteable_type: voteableType, voteable_id: voteableId },
  });

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
  } else {
    await Vote.create({
      user_id: userId,
      voteable_type: voteableType,
      voteable_id: voteableId,
      value: parseInt(value),
    });
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
      userId: req.user.id,
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
      userId: req.user.id,
      value,
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { votePost, voteComment };
