const { Op } = require('sequelize');
const { Notification } = require('../models');

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const offset = (page - 1) * perPage;

    const { rows, count } = await Notification.findAndCountAll({
      where: {
        notifiable_type: 'App\\Models\\User',
        notifiable_id: req.user.id,
      },
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    return res.json({
      current_page: page,
      data: rows,
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

async function markAsRead(req, res) {
  try {
    const notif = await Notification.findOne({
      where: {
        id: req.params.id,
        notifiable_type: 'App\\Models\\User',
        notifiable_id: req.user.id,
      },
    });
    if (!notif)
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });

    notif.read_at = new Date();
    await notif.save();
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
          notifiable_type: 'App\\Models\\User',
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

module.exports = { index, markAsRead, markAllAsRead };
