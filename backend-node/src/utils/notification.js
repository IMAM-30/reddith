const { Notification } = require('../models');

const TYPES = {
  VOTE_POST: 'vote_post',
  VOTE_COMMENT: 'vote_comment',
  COMMENT_POST: 'comment_post',
  REPLY_COMMENT: 'reply_comment',
};

async function createNotification({ userId, type, data }) {
  if (!userId || !type) return null;
  try {
    return await Notification.create({
      type,
      notifiable_type: 'App\\Models\\User',
      notifiable_id: userId,
      data: JSON.stringify(data || {}),
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { createNotification, TYPES };
