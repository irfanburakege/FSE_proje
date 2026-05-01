const { pool } = require('../config/db');

exports.getAuditLogs = async (req, res) => {
  const { search, limit } = req.query;
  const rowLimit = Number.parseInt(limit, 10);
  const safeLimit = Number.isInteger(rowLimit) && rowLimit > 0 ? Math.min(rowLimit, 500) : 100;

  try {
    let query = `
      SELECT
        al.id,
        COALESCE(u.name, 'System') AS user_name,
        al.action,
        al.details,
        al.timestamp
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
    `;
    const params = [];

    if (search && String(search).trim()) {
      query += `
        WHERE
          COALESCE(u.name, '') ILIKE $1 OR
          COALESCE(al.action, '') ILIKE $1 OR
          COALESCE(al.details, '') ILIKE $1
      `;
      params.push(`%${String(search).trim()}%`);
    }

    query += ` ORDER BY al.timestamp DESC LIMIT $${params.length + 1}`;
    params.push(safeLimit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
