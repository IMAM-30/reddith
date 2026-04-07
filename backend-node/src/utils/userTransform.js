const { Op } = require('sequelize');
const { assetUrl } = require('./asset');
const { Vote, Post, Comment } = require('../models');

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

module.exports = { transformUser, calculateKarma };
