const { pool } = require('../config/db');

exports.getVisits = async (req, res) => {
  const { date, doctorId, status } = req.query;
  try {
    let query = `
      SELECT pf.*, a.appointment_time, a.patient_id, a.priority_level, p.name as patient_name, d.id as doctor_id, u.name as doctor_name
      FROM patient_flow pf
      JOIN appointments a ON pf.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND DATE(a.appointment_time) = $${paramIndex++}`;
      params.push(date);
    }
    if (doctorId) {
      query += ` AND a.doctor_id = $${paramIndex++}`;
      params.push(doctorId);
    }
    if (status) {
      query += ` AND pf.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY pf.check_in_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  const { appointment_id } = req.body;
  try {
    // Check if appointment exists
    const apptCheck = await pool.query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
    if (apptCheck.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    // Status triggers will automatically create patient_flow record
    const result = await pool.query(`UPDATE appointments SET status = 'Confirmed' WHERE id = $1 RETURNING *`, [appointment_id]);
    res.json({ message: 'Check-in successful', appointment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params; // this is the appointment id for flow
  const { status } = req.body;
  try {
    // Updating appointment status triggers patient flow update
    const result = await pool.query(`UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
