const { Op } = require('sequelize');
const { Post, Community, User, CommunityUser, Vote } = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarmaBatch } = require('../utils/userTransform');

async function search(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { q: ['q required.'] },
      });
    }

    const like = { [Op.like]: `%${q}%` };

    const posts = await Post.findAll({
      where: { [Op.or]: [{ title: like }, { body: like }] },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const postsData = await Promise.all(
      posts.map(async (p) => {
        const obj = p.toJSON();
        obj.image_url = assetUrl(obj.image);
        if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
        obj.votes_sum_value =
          (await Vote.sum('value', {
            where: { voteable_type: Vote.TYPE_POST, voteable_id: obj.id },
          })) || 0;
        return obj;
      })
    );

    const communities = await Community.findAll({
      where: { [Op.or]: [{ name: like }, { description: like }] },
      limit: 10,
    });

    const communitiesData = await Promise.all(
      communities.map(async (c) => {
        const obj = c.toJSON();
        obj.icon_url = assetUrl(obj.icon);
        obj.members_count = await CommunityUser.count({
          where: { community_id: c.id },
        });
        return obj;
      })
    );

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: like },
          { name: like },
          { nim: like },
        ],
      },
      attributes: ['id', 'name', 'username', 'nim', 'avatar'],
      limit: 10,
    });

    const userIds = users.map((u) => u.id);
    const karmaMap = userIds.length ? await calculateKarmaBatch(userIds) : new Map();
    const usersData = users.map((u) => {
      const obj = u.toJSON();
      obj.avatar_url = assetUrl(obj.avatar);
      obj.karma = karmaMap.get(obj.id) || 0;
      return obj;
    });

    return res.json({ posts: postsData, communities: communitiesData, users: usersData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { search };
