const { Op } = require('sequelize');
const { assetUrl } = require('./asset');
const { Vote, Post, Comment } = require('../models');

// Versi batch — hitung karma untuk banyak user dalam beberapa query saja.
// Self-vote (user vote post/komen milik sendiri) tidak dihitung.
// Return Map<userId, karma>.
async function calculateKarmaBatch(userIds) {
  const result = new Map(userIds.map((id) => [id, 0]));
  if (!userIds.length) return result;

  const [posts, comments] = await Promise.all([
    Post.findAll({ where: { user_id: { [Op.in]: userIds } }, attributes: ['id', 'user_id'], raw: true }),
    Comment.findAll({ where: { user_id: { [Op.in]: userIds } }, attributes: ['id', 'user_id'], raw: true }),
  ]);

  const postOwner = new Map(posts.map((p) => [parseInt(p.id), parseInt(p.user_id)]));
  const commentOwner = new Map(comments.map((c) => [parseInt(c.id), parseInt(c.user_id)]));

  const tasks = [];
  if (posts.length) {
    tasks.push(
      Vote.findAll({
        where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: [...postOwner.keys()] } },
        attributes: ['voteable_id', 'value', 'user_id'],
        raw: true,
      }).then((rows) => {
        rows.forEach((r) => {
          const ownerId = postOwner.get(parseInt(r.voteable_id));
          if (ownerId == null) return;
          if (parseInt(r.user_id) === ownerId) return; // skip self-vote
          result.set(ownerId, (result.get(ownerId) || 0) + parseInt(r.value));
        });
      })
    );
  }
  if (comments.length) {
    tasks.push(
      Vote.findAll({
        where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: [...commentOwner.keys()] } },
        attributes: ['voteable_id', 'value', 'user_id'],
        raw: true,
      }).then((rows) => {
        rows.forEach((r) => {
          const ownerId = commentOwner.get(parseInt(r.voteable_id));
          if (ownerId == null) return;
          if (parseInt(r.user_id) === ownerId) return; // skip self-vote
          result.set(ownerId, (result.get(ownerId) || 0) + parseInt(r.value));
        });
      })
    );
  }
  await Promise.all(tasks);
  return result;
}

// Hitung karma user — sum vote di post & comment dia tulis,
// tidak termasuk vote yang dia berikan ke diri sendiri.
async function calculateKarma(userId) {
  const postIds = (
    await Post.findAll({ where: { user_id: userId }, attributes: ['id'] })
  ).map((p) => p.id);
  const commentIds = (
    await Comment.findAll({ where: { user_id: userId }, attributes: ['id'] })
  ).map((c) => c.id);

  let postKarma = 0;
  let commentKarma = 0;

  if (postIds.length) {
    postKarma =
      (await Vote.sum('value', {
        where: {
          voteable_type: Vote.TYPE_POST,
          voteable_id: { [Op.in]: postIds },
          user_id: { [Op.ne]: userId },
        },
      })) || 0;
  }
  if (commentIds.length) {
    commentKarma =
      (await Vote.sum('value', {
        where: {
          voteable_type: Vote.TYPE_COMMENT,
          voteable_id: { [Op.in]: commentIds },
          user_id: { [Op.ne]: userId },
        },
      })) || 0;
  }

  return parseInt(postKarma) + parseInt(commentKarma);
}

// Transform user object — buang password, tambah avatar_url & karma
async function transformUser(user, { withKarma = true } = {}) {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.remember_token;
  obj.avatar_url = assetUrl(obj.avatar);
  if (withKarma) {
    obj.karma = await calculateKarma(obj.id);
  }
  return obj;
}

module.exports = { transformUser, calculateKarma, calculateKarmaBatch };
