const { pool } = require('../config/db');

const ALLOWED_TYPES = new Set(['email', 'sms', 'system']);

exports.getNotifications = async (req, res) => {
  const { type, search, limit } = req.query;
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 100;

  try {
    let query = 'SELECT id, type, title, message, created_at FROM notifications';
    const params = [];
    const conditions = [];

    if (type && ALLOWED_TYPES.has(String(type))) {
      params.push(String(type));
      conditions.push(`type = $${params.length}`);
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`(title ILIKE $${params.length} OR message ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    params.push(safeLimit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNotification = async (req, res) => {
  const { type, title, message } = req.body;

  if (!type || !ALLOWED_TYPES.has(String(type))) {
    return res.status(400).json({ message: 'type must be one of: email, sms, system' });
  }
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'title is required' });
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: 'message is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = await client.query(
      `
        INSERT INTO notifications (type, title, message)
        VALUES ($1, $2, $3)
        RETURNING id, type, title, message, created_at
      `,
      [String(type), String(title).trim(), String(message).trim()]
    );

    await client.query(
      `
        INSERT INTO audit_logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `,
      [null, 'Manual Alert Sent', `[${String(type)}] ${String(title).trim()}`]
    );

    await client.query('COMMIT');
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
