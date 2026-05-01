const { pool } = require('../config/db');

exports.getDoctors = async (req, res) => {
  const { departmentId } = req.query;
  try {
    let query = `
      SELECT d.id, u.name, d.daily_patient_limit, dep.name as department_name, d.department_id 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dep ON d.department_id = dep.id
    `;
    let params = [];

    if (departmentId) {
      query += ` WHERE d.department_id = $1`;
      params.push(departmentId);
    }
    
    query += ` ORDER BY d.id ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT d.id, u.name, d.daily_patient_limit, dep.name as department_name, d.department_id 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dep ON d.department_id = dep.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Doctor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDoctor = async (req, res) => {
  const { user_id, department_id, daily_patient_limit } = req.body;

  if (!user_id || !department_id) {
    return res.status(400).json({ message: 'user_id and department_id are required' });
  }

  const limitValue = Number.parseInt(daily_patient_limit ?? 20, 10);
  if (!Number.isInteger(limitValue) || limitValue <= 0) {
    return res.status(400).json({ message: 'daily_patient_limit must be a positive integer' });
  }

  try {
    const insertQuery = `
      INSERT INTO doctors (user_id, department_id, daily_patient_limit)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const inserted = await pool.query(insertQuery, [user_id, department_id, limitValue]);

    const detailQuery = `
      SELECT d.id, u.name, d.daily_patient_limit, dep.name as department_name, d.department_id
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dep ON d.department_id = dep.id
      WHERE d.id = $1
    `;
    const detail = await pool.query(detailQuery, [inserted.rows[0].id]);
    res.status(201).json(detail.rows[0] || inserted.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
