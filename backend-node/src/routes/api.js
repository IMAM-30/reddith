const express = require('express');
const router = express.Router();

const { authRequired, authOptional } = require('../middleware/auth');
const { createUploader } = require('../middleware/upload');

const auth = require('../controllers/authController');
const community = require('../controllers/communityController');
const post = require('../controllers/postController');
const comment = require('../controllers/commentController');
const vote = require('../controllers/voteController');
const message = require('../controllers/messageController');
const notification = require('../controllers/notificationController');
const user = require('../controllers/userController');
const search = require('../controllers/searchController');
const report = require('../controllers/reportController');

const uploadCommunityIcon = createUploader('communities').single('icon');
const uploadCommunityMedia = createUploader('communities').fields([
  { name: 'icon', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);
const uploadPostImage = createUploader('posts').single('image');
const uploadAvatar = createUploader('avatars').single('avatar');
const uploadCover = createUploader('covers').single('cover');
const uploadReportEvidence = createUploader('reports').single('evidence');

// ── Public ──────────────────────────────────────────────
router.post('/register', auth.register);
router.post('/login', auth.login);

router.get('/posts', authOptional, post.index);
router.get('/posts/:id', authOptional, post.show);

router.get('/communities', authOptional, community.index);
router.get('/my-communities', authRequired, community.myCommunities);
router.get('/communities/:slug', authOptional, community.show);
router.get('/communities/:slug/posts', authOptional, post.byCommunity);

router.get('/posts/:id/comments', authOptional, comment.index);

router.get('/search', authOptional, search.search);

router.get('/profile/:id', user.profile);
router.get('/users/:username', user.show);
router.get('/users/:username/posts', authOptional, user.userPosts);
router.get('/users/:username/communities', community.userCommunities);

// ── Protected ───────────────────────────────────────────
router.post('/logout', authRequired, auth.logout);
router.get('/me', authRequired, auth.me);

// Communities
router.post('/communities', authRequired, uploadCommunityIcon, community.store);
router.post('/communities/:slug/join', authRequired, community.join);
router.delete('/communities/:slug/leave', authRequired, community.leave);

// Community owner actions
router.patch('/communities/:slug/settings', authRequired, uploadCommunityMedia, community.updateSettings);
router.get('/communities/:slug/members', authRequired, community.members);
router.get('/communities/:slug/requests', authRequired, community.requests);
router.post('/communities/:slug/requests/:userId/approve', authRequired, community.approveRequest);
router.post('/communities/:slug/requests/:userId/reject', authRequired, community.rejectRequest);
router.delete('/communities/:slug/members/:userId', authRequired, community.kickMember);

// Posts
router.post('/posts', authRequired, uploadPostImage, post.store);
router.put('/posts/:id', authRequired, post.update);
router.delete('/posts/:id', authRequired, post.destroy);

// Comments
router.post('/posts/:id/comments', authRequired, comment.store);
router.delete('/posts/:id/comments/:commentId', authRequired, comment.destroy);

// Votes
router.post('/posts/:id/vote', authRequired, vote.votePost);
router.post('/comments/:id/vote', authRequired, vote.voteComment);

// Notifications
router.get('/notifications', authRequired, notification.index);
router.get('/notifications/unread-count', authRequired, notification.unreadCount);
router.patch('/notifications/read-all', authRequired, notification.markAllAsRead);
router.patch('/notifications/batch-read', authRequired, notification.batchRead);
router.patch('/notifications/:id/read', authRequired, notification.markAsRead);
router.delete('/notifications/clear-all', authRequired, notification.destroyAll);
router.delete('/notifications/batch', authRequired, notification.batchDestroy);
router.delete('/notifications/:id', authRequired, notification.destroy);

// Reports & moderation
router.post('/reports', authRequired, uploadReportEvidence, report.store);
router.get('/moderation/reports', authRequired, report.index);
router.patch('/moderation/reports/:id/dismiss', authRequired, report.dismiss);
router.post('/moderation/reports/:id/delete-target', authRequired, report.deleteTarget);

// Profile
router.post('/update-avatar', authRequired, uploadAvatar, user.updateAvatar);
router.post('/update-cover', authRequired, uploadCover, user.updateCover);
router.put('/update-profile', authRequired, user.updateProfile);

// Direct Messages
router.get('/messages/threads', authRequired, message.threads);
router.get('/messages/inbox', authRequired, message.inbox);
router.get('/messages/sent', authRequired, message.sent);
router.get('/messages/conversation/:userId', authRequired, message.conversation);
router.post('/messages', authRequired, message.store);
router.patch('/messages/conversation/:userId/read-all', authRequired, message.readThread);
router.patch('/messages/:id/read', authRequired, message.read);
router.delete('/messages/thread/:userId', authRequired, message.destroyThread);
router.delete('/messages/:id', authRequired, message.destroyMessage);

module.exports = router;
