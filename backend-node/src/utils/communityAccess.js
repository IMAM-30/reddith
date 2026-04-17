const { Op } = require('sequelize');
const { Community, CommunityUser } = require('../models');

async function getBlockedPrivateCommunityIds(userId) {
  const privates = await Community.findAll({
    where: { visibility: 'private' },
    attributes: ['id', 'user_id'],
    raw: true,
  });
  if (!privates.length) return [];

  const privateIds = privates.map((c) => parseInt(c.id));
  if (userId == null) return privateIds;

  const uid = parseInt(userId);
  const memberships = await CommunityUser.findAll({
    where: {
      user_id: uid,
      community_id: { [Op.in]: privateIds },
      status: 'active',
    },
    attributes: ['community_id'],
    raw: true,
  });

  const allowed = new Set([
    ...privates.filter((c) => parseInt(c.user_id) === uid).map((c) => parseInt(c.id)),
    ...memberships.map((m) => parseInt(m.community_id)),
  ]);
  return privateIds.filter((id) => !allowed.has(id));
}

function postAccessWhere(blockedIds) {
  if (!blockedIds.length) return {};
  return {
    [Op.or]: [
      { community_id: null },
      { community_id: { [Op.notIn]: blockedIds } },
    ],
  };
}

async function canAccessCommunity(community, userId) {
  if (!community || community.visibility !== 'private') return true;
  if (userId == null) return false;
  const uid = parseInt(userId);
  if (parseInt(community.user_id) === uid) return true;
  const membership = await CommunityUser.findOne({
    where: { community_id: community.id, user_id: uid, status: 'active' },
  });
  return !!membership;
}

module.exports = { getBlockedPrivateCommunityIds, postAccessWhere, canAccessCommunity };
