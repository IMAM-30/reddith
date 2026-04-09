const { Op, fn, col, literal } = require('sequelize');
const { DirectMessage, User } = require('../models');
const { assetUrl } = require('../utils/asset');
const { calculateKarmaBatch } = require('../utils/userTransform');

async function threads(req, res) {
  try {
    const userId = req.user.id;

    // 1. Ambil semua partner id dalam 1 query
    const partners = await DirectMessage.findAll({
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      attributes: [
        [literal(`CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END`), 'other_id'],
      ],
      group: ['other_id'],
      raw: true,
    });
    const ids = partners.map((p) => parseInt(p.other_id)).filter((id) => id && id !== userId);

    if (!ids.length) return res.json([]);

    // 2. Batch fetch: users, karma map, unread count map, last messages — paralel
    const [users, karmaMap, unreadRows, lastMsgs] = await Promise.all([
      User.findAll({ where: { id: { [Op.in]: ids } }, raw: true }),
      calculateKarmaBatch(ids),
      DirectMessage.findAll({
        where: { receiver_id: userId, sender_id: { [Op.in]: ids }, read_at: null },
        attributes: ['sender_id', [fn('COUNT', col('id')), 'cnt']],
        group: ['sender_id'],
        raw: true,
      }),
      // Last message per pair — fetch semua msg yg melibatkan user+partner, sort desc, ambil pertama per pair di JS
      DirectMessage.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: { [Op.in]: ids } },
            { receiver_id: userId, sender_id: { [Op.in]: ids } },
          ],
        },
        order: [['created_at', 'DESC']],
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const unreadMap = new Map(unreadRows.map((r) => [parseInt(r.sender_id), parseInt(r.cnt)]));
    const lastMsgMap = new Map();
    for (const m of lastMsgs) {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (!lastMsgMap.has(otherId)) lastMsgMap.set(otherId, m);
    }

    const threadsData = ids.map((otherId) => {
      const u = userMap.get(otherId);
      return {
        user: u
          ? {
              id: u.id,
              name: u.name,
              username: u.username,
              avatar_url: assetUrl(u.avatar),
              karma: karmaMap.get(otherId) || 0,
            }
          : null,
        last_message: lastMsgMap.get(otherId) || null,
        unread_count: unreadMap.get(otherId) || 0,
      };
    });

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

    // Batch fetch parent messages buat reply preview
    const replyIds = [...new Set(rows.map((m) => m.reply_to_id).filter(Boolean))];
    const parentMap = new Map();
    if (replyIds.length) {
      const parents = await DirectMessage.findAll({
        where: { id: { [Op.in]: replyIds } },
        attributes: ['id', 'sender_id', 'body'],
        raw: true,
      });
      parents.forEach((p) => parentMap.set(p.id, p));
    }

    const data = rows.map((m) => {
      const obj = m.toJSON();
      if (obj.sender) obj.sender.avatar_url = assetUrl(obj.sender.avatar);
      if (obj.reply_to_id && parentMap.has(obj.reply_to_id)) {
        const p = parentMap.get(obj.reply_to_id);
        obj.reply_to = { id: p.id, sender_id: p.sender_id, body: p.body };
      }
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
    const { username, body, reply_to_id } = req.body;
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

    // Validasi reply_to_id (harus pesan dalam thread yang sama)
    let validReplyId = null;
    if (reply_to_id) {
      const parent = await DirectMessage.findByPk(reply_to_id);
      if (parent && (
        (parent.sender_id === req.user.id && parent.receiver_id === receiver.id) ||
        (parent.sender_id === receiver.id && parent.receiver_id === req.user.id)
      )) {
        validReplyId = parent.id;
      }
    }

    const message = await DirectMessage.create({
      sender_id: req.user.id,
      receiver_id: receiver.id,
      body,
      reply_to_id: validReplyId,
    });

    const full = await DirectMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'receiver', attributes: ['id', 'name', 'username', 'avatar'] },
      ],
    });
    const obj = full.toJSON();
    if (obj.receiver) obj.receiver.avatar_url = assetUrl(obj.receiver.avatar);

    // Sertakan preview parent message kalau reply
    if (validReplyId) {
      const parent = await DirectMessage.findByPk(validReplyId, { attributes: ['id', 'sender_id', 'body'] });
      if (parent) obj.reply_to = { id: parent.id, sender_id: parent.sender_id, body: parent.body };
    }
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

async function readThread(req, res) {
  try {
    const userId = req.user.id;
    const otherId = parseInt(req.params.userId);
    if (!otherId) return res.status(400).json({ message: 'Invalid user id.' });

    const [affected] = await DirectMessage.update(
      { read_at: new Date() },
      {
        where: {
          sender_id: otherId,
          receiver_id: userId,
          read_at: null,
        },
      }
    );
    return res.json({ message: 'Thread marked as read.', updated: affected });
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
  readThread,
  destroyMessage,
  destroyThread,
};
