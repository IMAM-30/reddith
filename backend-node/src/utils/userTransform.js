const { Op, fn, col } = require('sequelize');
const { assetUrl } = require('./asset');
const { Vote, Post, Comment } = require('../models');

// Versi batch — hitung karma untuk banyak user dalam beberapa query saja.
// Return Map<userId, karma>.
async function calculateKarmaBatch(userIds) {
  const result = new Map(userIds.map((id) => [id, 0]));
  if (!userIds.length) return result;

  const [posts, comments] = await Promise.all([
    Post.findAll({ where: { user_id: { [Op.in]: userIds } }, attributes: ['id', 'user_id'], raw: true }),
    Comment.findAll({ where: { user_id: { [Op.in]: userIds } }, attributes: ['id', 'user_id'], raw: true }),
  ]);

  const postOwner = new Map(posts.map((p) => [p.id, p.user_id]));
  const commentOwner = new Map(comments.map((c) => [c.id, c.user_id]));

  const tasks = [];
  if (posts.length) {
    tasks.push(
      Vote.findAll({
        where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: [...postOwner.keys()] } },
        attributes: ['voteable_id', [fn('SUM', col('value')), 'total']],
        group: ['voteable_id'],
        raw: true,
      }).then((rows) => {
        rows.forEach((r) => {
          const uid = postOwner.get(parseInt(r.voteable_id));
          if (uid != null) result.set(uid, (result.get(uid) || 0) + parseInt(r.total));
        });
      })
    );
  }
  if (comments.length) {
    tasks.push(
      Vote.findAll({
        where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: [...commentOwner.keys()] } },
        attributes: ['voteable_id', [fn('SUM', col('value')), 'total']],
        group: ['voteable_id'],
        raw: true,
      }).then((rows) => {
        rows.forEach((r) => {
          const uid = commentOwner.get(parseInt(r.voteable_id));
          if (uid != null) result.set(uid, (result.get(uid) || 0) + parseInt(r.total));
        });
      })
    );
  }
  await Promise.all(tasks);
  return result;
}

// Hitung karma user (sum value vote di semua post & comment yang dia tulis)
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
        where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: postIds } },
      })) || 0;
  }
  if (commentIds.length) {
    commentKarma =
      (await Vote.sum('value', {
        where: {
          voteable_type: Vote.TYPE_COMMENT,
          voteable_id: { [Op.in]: commentIds },
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
