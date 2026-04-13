const { Op, fn, col } = require('sequelize');
const {
  Post,
  Community,
  User,
  Comment,
  Vote,
} = require('../models');
const { assetUrl } = require('../utils/asset');
const { relativePathFromFile, deleteStorageFile } = require('../middleware/upload');

async function withCounts(post, userId = null) {
  if (!post) return null;
  const obj = post.toJSON ? post.toJSON() : { ...post };
  obj.image_url = assetUrl(obj.image);
  obj.comments_count = await Comment.count({ where: { post_id: obj.id } });
  obj.votes_sum_value =
    (await Vote.sum('value', {
      where: { voteable_type: Vote.TYPE_POST, voteable_id: obj.id },
    })) || 0;
  if (userId) {
    const v = await Vote.findOne({
      where: { voteable_type: Vote.TYPE_POST, voteable_id: obj.id, user_id: userId },
      attributes: ['value'],
    });
    obj.user_vote = v ? v.value : 0;
  } else {
    obj.user_vote = 0;
  }
  if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
  if (obj.community) obj.community.icon_url = assetUrl(obj.community.icon);
  return obj;
}

// Versi batch — hindari N+1 saat list. Single SQL untuk count comments,
// sum votes, dan user_vote semua post sekaligus.
async function batchEnrich(rows, userId = null) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [commentRows, voteRows, myVoteRows] = await Promise.all([
    Comment.findAll({
      where: { post_id: { [Op.in]: ids } },
      attributes: ['post_id', [fn('COUNT', col('id')), 'cnt']],
      group: ['post_id'],
      raw: true,
    }),
    Vote.findAll({
      where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: ids } },
      attributes: ['voteable_id', [fn('SUM', col('value')), 'total']],
      group: ['voteable_id'],
      raw: true,
    }),
    userId
      ? Vote.findAll({
          where: { voteable_type: Vote.TYPE_POST, voteable_id: { [Op.in]: ids }, user_id: userId },
          attributes: ['voteable_id', 'value'],
          raw: true,
        })
      : Promise.resolve([]),
  ]);

  const commentMap = new Map(commentRows.map((r) => [parseInt(r.post_id), parseInt(r.cnt)]));
  const voteMap = new Map(voteRows.map((r) => [parseInt(r.voteable_id), parseInt(r.total)]));
  const myVoteMap = new Map(myVoteRows.map((r) => [parseInt(r.voteable_id), parseInt(r.value)]));

  return rows.map((p) => {
    const obj = p.toJSON ? p.toJSON() : { ...p };
    obj.image_url = assetUrl(obj.image);
    obj.comments_count = commentMap.get(obj.id) || 0;
    obj.votes_sum_value = voteMap.get(obj.id) || 0;
    obj.user_vote = myVoteMap.get(obj.id) || 0;
    if (obj.user) obj.user.avatar_url = assetUrl(obj.user.avatar);
    if (obj.community) obj.community.icon_url = assetUrl(obj.community.icon);
    return obj;
  });
}

async function paginatePosts(where, page, userId = null) {
  page = parseInt(page) || 1;
  const perPage = 15;
  const offset = (page - 1) * perPage;

  const { rows, count } = await Post.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
      { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
    ],
    order: [['created_at', 'DESC']],
    limit: perPage,
    offset,
    distinct: true,
  });

  const data = await batchEnrich(rows, userId);

  return {
    current_page: page,
    data,
    from: count === 0 ? null : offset + 1,
    to: count === 0 ? null : offset + rows.length,
    last_page: Math.max(1, Math.ceil(count / perPage)),
    per_page: perPage,
    total: count,
  };
}

async function index(req, res) {
  try {
    const result = await paginatePosts({}, req.query.page, req.user?.id || null);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function byCommunity(req, res) {
  try {
    const community = await Community.findOne({ where: { slug: req.params.slug } });
    if (!community)
      return res.status(404).json({ message: 'Community tidak ditemukan.' });

    const result = await paginatePosts({ community_id: community.id }, req.query.page, req.user?.id || null);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function show(req, res) {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
      ],
    });
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    const result = await withCounts(post, req.user?.id || null);
    return res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function store(req, res) {
  try {
    const { title, body, community_id } = req.body;
    if (!title) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { title: ['Title required.'] },
      });
    }

    // community_id opsional — validasi hanya jika diisi
    let resolvedCommunityId = null;
    if (community_id) {
      const community = await Community.findByPk(community_id);
      if (!community) {
        return res.status(422).json({
          message: 'The given data was invalid.',
          errors: { community_id: ['Community tidak ditemukan.'] },
        });
      }
      resolvedCommunityId = community.id;
    }

    const imagePath = relativePathFromFile(req.file, 'posts');
    const post = await Post.create({
      user_id: req.user.id,
      community_id: resolvedCommunityId,
      title,
      body: body || null,
      image: imagePath,
    });

    const full = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Community, as: 'community', attributes: ['id', 'name', 'slug'] },
      ],
    });

    const result = await withCounts(full);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function destroy(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan.' });

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (post.image) deleteStorageFile(post.image);
    await post.destroy();
    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { index, byCommunity, show, store, destroy, withCounts, batchEnrich };
