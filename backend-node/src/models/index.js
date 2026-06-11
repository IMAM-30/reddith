const sequelize = require('../config/database');

const User = require('./User');
const Community = require('./Community');
const CommunityUser = require('./CommunityUser');
const Post = require('./Post');
const Comment = require('./Comment');
const Vote = require('./Vote');
const DirectMessage = require('./DirectMessage');
const Notification = require('./Notification');
const Report = require('./Report');

// ============ RELASI ============

// User <-> Community (creator)
User.hasMany(Community, { foreignKey: 'user_id', as: 'createdCommunities' });
Community.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });

// User <-> Community (members) — many-to-many lewat community_user
User.belongsToMany(Community, {
  through: CommunityUser,
  foreignKey: 'user_id',
  otherKey: 'community_id',
  as: 'communities',
});
Community.belongsToMany(User, {
  through: CommunityUser,
  foreignKey: 'community_id',
  otherKey: 'user_id',
  as: 'members',
});

// User <-> Post
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Community <-> Post
Community.hasMany(Post, { foreignKey: 'community_id', as: 'posts' });
Post.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Post <-> Comment
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Comment nested (parent <-> replies)
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

// User <-> Vote
User.hasMany(Vote, { foreignKey: 'user_id', as: 'votes' });
Vote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Catatan: Vote polymorphic — relasi ke Post/Comment dihandle manual di controller

// User <-> DirectMessage (sender & receiver)
User.hasMany(DirectMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(DirectMessage, {
  foreignKey: 'receiver_id',
  as: 'receivedMessages',
});
DirectMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
DirectMessage.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// User <-> Report (reporter, target owner, moderator)
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'submittedReports' });
User.hasMany(Report, { foreignKey: 'target_owner_id', as: 'receivedReports' });
User.hasMany(Report, { foreignKey: 'moderator_id', as: 'moderatedReports' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'target_owner_id', as: 'targetOwner' });
Report.belongsTo(User, { foreignKey: 'moderator_id', as: 'moderator' });
Post.hasMany(Report, { foreignKey: 'post_id', as: 'reports' });
Report.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

module.exports = {
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
};
