const { Op } = require('sequelize');
const {
  Post,
  Community,
  User,
  Comment,
  Vote,
} = require('../models');
const { assetUrl } = require('../utils/asset');
const { relativePathFromFile, deleteStorageFile } = require('../middleware/upload');

async function withCounts(post) {
  if (!post) return null;
  const obj = post.toJSON ? post.toJSON() : { ...post };
  obj.image_url = assetUrl(obj.image);
  obj.comments_count = await Comment.count({ where: { post_id: obj.id } });
  obj.votes_sum_value =
    (await Vote.sum('value', {
      where: { voteable_type: Vote.TYPE_POST, voteable_id: obj.id },
    })) || 0;
  if (obj.user) {
    obj.user.avatar_url = assetUrl(obj.user.avatar);
  }
  return obj;
}

async function paginatePosts(where, page) {
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

  const data = await Promise.all(rows.map(withCounts));

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
    const result = await paginatePosts({}, req.query.page);
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

    const result = await paginatePosts({ community_id: community.id }, req.query.page);
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

    const result = await withCounts(post);
    return res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function store(req, res) {
  try {
    const { title, body, community_id } = req.body;
    if (!title || !community_id) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: {
          title: !title ? ['Title required.'] : undefined,
          community_id: !community_id ? ['Community required.'] : undefined,
        },
      });
    }

    const community = await Community.findByPk(community_id);
    if (!community) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { community_id: ['Community tidak ditemukan.'] },
      });
    }

    const imagePath = relativePathFromFile(req.file, 'posts');
    const post = await Post.create({
      user_id: req.user.id,
      community_id,
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

module.exports = { index, byCommunity, show, store, destroy, withCounts };
