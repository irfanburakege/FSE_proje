const { pool } = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password_hash, role } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  try {
    const safeName = String(name).trim();
    const generatedEmail = `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${Date.now()}@local.test`;
    const userEmail = (email && String(email).trim()) || generatedEmail;
    const passwordHash = (password_hash && String(password_hash).trim()) || 'temp_hash_change_me';
    const userRole = (role && String(role).trim()) || 'Doctor Session';

    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [safeName, userEmail, passwordHash, userRole]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
