const { Op } = require('sequelize');
const { Notification } = require('../models');
const { assetUrl } = require('../utils/asset');

const USER_TYPE = 'App\\Models\\User';

function parseData(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function transform(notif) {
  const obj = notif.toJSON ? notif.toJSON() : { ...notif };
  const data = parseData(obj.data);
  if (data.actor && data.actor.avatar) {
    data.actor.avatar_url = assetUrl(data.actor.avatar);
  }
  obj.data = data;
  return obj;
}

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Notification.findAndCountAll({
      where: {
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
      },
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    const data = rows.map(transform);

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

async function unreadCount(req, res) {
  try {
    const count = await Notification.count({
      where: {
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
        read_at: null,
      },
    });
    return res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const notif = await Notification.findOne({
      where: {
        id: req.params.id,
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
      },
    });
    if (!notif)
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });

    if (!notif.read_at) {
      notif.read_at = new Date();
      await notif.save();
    }
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await Notification.update(
      { read_at: new Date() },
      {
        where: {
          notifiable_type: USER_TYPE,
          notifiable_id: req.user.id,
          read_at: null,
        },
      }
    );
    return res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function destroy(req, res) {
  try {
    const notif = await Notification.findOne({
      where: {
        id: req.params.id,
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
      },
    });
    if (!notif)
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    await notif.destroy();
    return res.json({ message: 'Notifikasi dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function destroyAll(req, res) {
  try {
    await Notification.destroy({
      where: {
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
      },
    });
    return res.json({ message: 'Semua notifikasi dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function parseIds(body) {
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  return ids.filter((v) => typeof v === 'string' && v.length > 0).slice(0, 200);
}

async function batchRead(req, res) {
  try {
    const ids = parseIds(req.body);
    if (!ids.length) return res.json({ message: 'No ids provided.', updated: 0 });
    const [affected] = await Notification.update(
      { read_at: new Date() },
      {
        where: {
          id: { [Op.in]: ids },
          notifiable_type: USER_TYPE,
          notifiable_id: req.user.id,
          read_at: null,
        },
      }
    );
    return res.json({ message: 'Batch marked as read.', updated: affected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function batchDestroy(req, res) {
  try {
    const ids = parseIds(req.body);
    if (!ids.length) return res.json({ message: 'No ids provided.', deleted: 0 });
    const deleted = await Notification.destroy({
      where: {
        id: { [Op.in]: ids },
        notifiable_type: USER_TYPE,
        notifiable_id: req.user.id,
      },
    });
    return res.json({ message: 'Batch deleted.', deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  index,
  unreadCount,
  markAsRead,
  markAllAsRead,
  destroy,
  destroyAll,
  batchRead,
  batchDestroy,
};
