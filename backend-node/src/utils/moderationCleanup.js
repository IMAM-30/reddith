const { Op } = require('sequelize');
const {
  sequelize,
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
const { deleteStorageFile } = require('../middleware/upload');

function postDataLike(postId) {
  return { [Op.like]: `%"post_id":${Number(postId)}%` };
}

function commentDataLike(commentId) {
  return { [Op.like]: `%"comment_id":${Number(commentId)}%` };
}

async function deleteReports(where, transaction) {
  const reports = await Report.findAll({
    where,
    attributes: ['id', 'evidence_image'],
    raw: true,
    transaction,
  });
  if (!reports.length) return 0;

  const deleted = await Report.destroy({
    where: { id: { [Op.in]: reports.map((report) => report.id) } },
    transaction,
  });
  reports.forEach((report) => {
    if (report.evidence_image) deleteStorageFile(report.evidence_image);
  });
  return deleted;
}

async function collectCommentTreeIds(rootIds, transaction) {
  const ids = [...new Set(rootIds.map(Number).filter(Boolean))];
  for (let i = 0; i < ids.length; i += 1) {
    const children = await Comment.findAll({
      where: { parent_id: ids[i] },
      attributes: ['id'],
      raw: true,
      transaction,
    });
    children.forEach((child) => {
      const id = Number(child.id);
      if (!ids.includes(id)) ids.push(id);
    });
  }
  return ids;
}

async function deleteCommentsByIds(commentIds, transaction) {
  const ids = await collectCommentTreeIds(commentIds, transaction);
  if (!ids.length) return { comments: 0, votes: 0, reports: 0, notifications: 0 };

  const deletedVotes = await Vote.destroy({
    where: { voteable_type: Vote.TYPE_COMMENT, voteable_id: { [Op.in]: ids } },
    transaction,
  });
  const deletedReports = await deleteReports({
    [Op.or]: [
      { target_type: 'comment', target_id: { [Op.in]: ids } },
    ],
  }, transaction);

  let deletedNotifications = 0;
  for (const id of ids) {
    deletedNotifications += await Notification.destroy({
      where: { data: commentDataLike(id) },
      transaction,
    });
  }

  for (const id of [...ids].reverse()) {
    await Comment.destroy({ where: { id }, transaction });
  }

  return {
    comments: ids.length,
    votes: deletedVotes,
    reports: deletedReports,
    notifications: deletedNotifications,
  };
}

async function deletePostById(postId, transaction) {
  const post = await Post.findByPk(postId, { transaction });
  if (!post) return { posts: 0, comments: 0, votes: 0, reports: 0, notifications: 0 };

  const comments = await Comment.findAll({
    where: { post_id: post.id },
    attributes: ['id'],
    raw: true,
    transaction,
  });
  const commentCleanup = await deleteCommentsByIds(comments.map((comment) => comment.id), transaction);

  const deletedPostVotes = await Vote.destroy({
    where: { voteable_type: Vote.TYPE_POST, voteable_id: post.id },
    transaction,
  });
  const deletedReports = await deleteReports({
    [Op.or]: [
      { target_type: 'post', target_id: post.id },
      { post_id: post.id },
    ],
  }, transaction);
  const deletedNotifications = await Notification.destroy({
    where: { data: postDataLike(post.id) },
    transaction,
  });

  const image = post.image;
  await post.destroy({ transaction });
  if (image) deleteStorageFile(image);

  return {
    posts: 1,
    comments: commentCleanup.comments,
    votes: commentCleanup.votes + deletedPostVotes,
    reports: commentCleanup.reports + deletedReports,
    notifications: commentCleanup.notifications + deletedNotifications,
  };
}

function mergeCounts(base, next) {
  Object.entries(next || {}).forEach(([key, value]) => {
    base[key] = (base[key] || 0) + (Number(value) || 0);
  });
  return base;
}

async function deleteCommunityById(communityId, transaction) {
  const community = await Community.findByPk(communityId, { transaction });
  if (!community) return { communities: 0 };

  const counts = { communities: 1, posts: 0, comments: 0, votes: 0, reports: 0, notifications: 0, members: 0 };
  const posts = await Post.findAll({
    where: { community_id: community.id },
    attributes: ['id'],
    raw: true,
    transaction,
  });
  for (const post of posts) {
    mergeCounts(counts, await deletePostById(post.id, transaction));
  }

  counts.members = await CommunityUser.destroy({
    where: { community_id: community.id },
    transaction,
  });

  const icon = community.icon;
  const cover = community.cover;
  await community.destroy({ transaction });
  if (icon) deleteStorageFile(icon);
  if (cover) deleteStorageFile(cover);

  return counts;
}

async function deleteUserById(userId, actorId, transaction) {
  const user = await User.findByPk(userId, { transaction });
  if (!user) return { users: 0 };
  if (Number(user.id) === Number(actorId)) {
    const error = new Error('Moderator tidak bisa menghapus akun sendiri.');
    error.status = 422;
    throw error;
  }

  const counts = {
    users: 1,
    communities: 0,
    posts: 0,
    comments: 0,
    votes: 0,
    reports: 0,
    notifications: 0,
    messages: 0,
    memberships: 0,
  };

  const ownedCommunities = await Community.findAll({
    where: { user_id: user.id },
    attributes: ['id'],
    raw: true,
    transaction,
  });
  for (const community of ownedCommunities) {
    mergeCounts(counts, await deleteCommunityById(community.id, transaction));
  }

  const posts = await Post.findAll({
    where: { user_id: user.id },
    attributes: ['id'],
    raw: true,
    transaction,
  });
  for (const post of posts) {
    mergeCounts(counts, await deletePostById(post.id, transaction));
  }

  const comments = await Comment.findAll({
    where: { user_id: user.id },
    attributes: ['id'],
    raw: true,
    transaction,
  });
  mergeCounts(counts, await deleteCommentsByIds(comments.map((comment) => comment.id), transaction));

  counts.votes += await Vote.destroy({ where: { user_id: user.id }, transaction });
  counts.messages = await DirectMessage.destroy({
    where: {
      [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }],
    },
    transaction,
  });
  counts.memberships = await CommunityUser.destroy({ where: { user_id: user.id }, transaction });
  counts.notifications += await Notification.destroy({
    where: {
      [Op.or]: [
        { notifiable_id: user.id },
        { data: { [Op.like]: `%"user_id":${Number(user.id)}%` } },
      ],
    },
    transaction,
  });
  counts.reports += await deleteReports({
    [Op.or]: [
      { reporter_id: user.id },
      { target_owner_id: user.id },
      { moderator_id: user.id },
    ],
  }, transaction);

  const avatar = user.avatar;
  const cover = user.cover;
  await user.destroy({ transaction });
  if (avatar) deleteStorageFile(avatar);
  if (cover) deleteStorageFile(cover);

  return counts;
}

async function withCleanupTransaction(task) {
  return sequelize.transaction(task);
}

module.exports = {
  withCleanupTransaction,
  deletePostById,
  deleteCommentsByIds,
  deleteCommunityById,
  deleteUserById,
};
