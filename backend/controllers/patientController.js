const { pool } = require('../config/db');

exports.getPatients = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPatientById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPatient = async (req, res) => {
  const { name, phone_number, national_id } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO patients (name, phone_number, national_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [
        String(name).trim(),
        phone_number ? String(phone_number).trim() : null,
        national_id ? String(national_id).trim() : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
