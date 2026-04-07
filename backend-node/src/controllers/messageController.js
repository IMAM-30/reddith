const { Op } = require('sequelize');
const { DirectMessage, User } = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarma } = require('../utils/userTransform');

function transformUserMini(u) {
  if (!u) return null;
  const obj = u.toJSON ? u.toJSON() : { ...u };
  obj.avatar_url = assetUrl(obj.avatar);
  return obj;
}

async function threads(req, res) {
  try {
    const userId = req.user.id;

    const sentTo = await DirectMessage.findAll({
      where: { sender_id: userId },
      attributes: ['receiver_id'],
      group: ['receiver_id'],
    });
    const receivedFrom = await DirectMessage.findAll({
      where: { receiver_id: userId },
      attributes: ['sender_id'],
      group: ['sender_id'],
    });

    const ids = new Set();
    sentTo.forEach((m) => ids.add(m.receiver_id));
    receivedFrom.forEach((m) => ids.add(m.sender_id));

    const threadsData = await Promise.all(
      Array.from(ids).map(async (otherId) => {
        const lastMessage = await DirectMessage.findOne({
          where: {
            [Op.or]: [
              { sender_id: userId, receiver_id: otherId },
              { sender_id: otherId, receiver_id: userId },
            ],
          },
          order: [['created_at', 'DESC']],
        });

        const otherUser = await User.findByPk(otherId);
        let other = null;
        if (otherUser) {
          other = {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            avatar_url: assetUrl(otherUser.avatar),
            karma: await calculateKarma(otherUser.id),
          };
        }

        const unread = await DirectMessage.count({
          where: {
            sender_id: otherId,
            receiver_id: userId,
            read_at: null,
          },
        });

        return {
          user: other,
          last_message: lastMessage,
          unread_count: unread,
        };
      })
    );

    threadsData.sort((a, b) => {
      const ta = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
      const tb = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
      return tb - ta;
    });

    return res.json(threadsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function inbox(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await DirectMessage.findAndCountAll({
      where: { receiver_id: req.user.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    const data = rows.map((m) => {
      const obj = m.toJSON();
      if (obj.sender) obj.sender.avatar_url = assetUrl(obj.sender.avatar);
      return obj;
    });

    return res.json({
      current_page: page,
      data,
      from: count === 0 ? null : offset + 1,
      to: count === 0 ? null : offset + rows.length,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      per_page: perPage,
      total: count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function sent(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await DirectMessage.findAndCountAll({
      where: { sender_id: req.user.id },
      include: [
        { model: User, as: 'receiver', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    const data = rows.map((m) => {
      const obj = m.toJSON();
      if (obj.receiver) obj.receiver.avatar_url = assetUrl(obj.receiver.avatar);
      return obj;
    });

    return res.json({
      current_page: page,
      data,
      from: count === 0 ? null : offset + 1,
      to: count === 0 ? null : offset + rows.length,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      per_page: perPage,
      total: count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function conversation(req, res) {
  try {
    const userId = req.user.id;
    const otherId = parseInt(req.params.userId);

    const otherUser = await User.findByPk(otherId);
    if (!otherUser)
      return res.status(404).json({ message: 'User tidak ditemukan.' });

    const page = parseInt(req.query.page) || 1;
    const perPage = 50;
    const offset = (page - 1) * perPage;

    const { rows, count } = await DirectMessage.findAndCountAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: otherId },
          { sender_id: otherId, receiver_id: userId },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
      order: [['created_at', 'ASC']],
      limit: perPage,
      offset,
    });

    const data = rows.map((m) => {
      const obj = m.toJSON();
      if (obj.sender) obj.sender.avatar_url = assetUrl(obj.sender.avatar);
      return obj;
    });

    return res.json({
      current_page: page,
      data,
      from: count === 0 ? null : offset + 1,
      to: count === 0 ? null : offset + rows.length,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      per_page: perPage,
      total: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function store(req, res) {
  try {
    const { username, body } = req.body;
    if (!username || !body) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: {
          username: !username ? ['Username required.'] : undefined,
          body: !body ? ['Body required.'] : undefined,
        },
      });
    }

    const receiver = await User.findOne({ where: { username } });
    if (!receiver) {
      return res
        .status(422)
        .json({
          message: 'The given data was invalid.',
          errors: { username: ['Username tidak ditemukan.'] },
        });
    }

    const message = await DirectMessage.create({
      sender_id: req.user.id,
      receiver_id: receiver.id,
      body,
    });

    const full = await DirectMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'receiver', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
    });
    const obj = full.toJSON();
    if (obj.receiver) obj.receiver.avatar_url = assetUrl(obj.receiver.avatar);
    return res.status(201).json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function read(req, res) {
  try {
    const message = await DirectMessage.findByPk(req.params.id);
    if (!message)
      return res.status(404).json({ message: 'Message tidak ditemukan.' });

    if (message.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    message.read_at = new Date();
    await message.save();
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function destroyMessage(req, res) {
  try {
    const message = await DirectMessage.findByPk(req.params.id);
    if (!message)
      return res.status(404).json({ message: 'Message tidak ditemukan.' });

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    await message.destroy();
    return res.json({ message: 'Pesan dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function destroyThread(req, res) {
  try {
    const userId = req.user.id;
    const otherId = parseInt(req.params.userId);

    await DirectMessage.destroy({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: otherId },
          { sender_id: otherId, receiver_id: userId },
        ],
      },
    });
    return res.json({ message: 'Percakapan dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  threads,
  inbox,
  sent,
  conversation,
  store,
  read,
  destroyMessage,
  destroyThread,
};
