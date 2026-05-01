const { pool } = require('../config/db');

exports.getAppointments = async (req, res) => {
  const { doctorId, patientId, status, date } = req.query;
  try {
    let query = `
      SELECT a.*, p.name as patient_name, d.id as doctor_id, u.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (doctorId) {
      query += ` AND a.doctor_id = $${paramIndex++}`;
      params.push(doctorId);
    }
    if (patientId) {
      query += ` AND a.patient_id = $${paramIndex++}`;
      params.push(patientId);
    }
    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    if (date) {
      query += ` AND DATE(a.appointment_time) = $${paramIndex++}`;
      params.push(date);
    }

    query += ` ORDER BY a.appointment_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  const { patient_id, doctor_id, appointment_time, priority_level } = req.body;
  try {
    // The trigger check_doctor_limit will automatically check the limit
    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, priority_level)
      VALUES ($1, $2, $3, 'Requested', $4)
      RETURNING *
    `;
    const result = await pool.query(query, [patient_id, doctor_id, appointment_time, priority_level || 'Normal']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('Daily patient limit reached')) {
      return res.status(400).json({ error: 'Doctor has reached the maximum patient limit for this day.' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const query = `
      UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppointmentPriority = async (req, res) => {
  const { id } = req.params;
  const { priority_level } = req.body;
  const allowed = new Set(['Normal', 'Emergency', 'Delayed']);

  if (!priority_level || !allowed.has(priority_level)) {
    return res.status(400).json({ message: 'priority_level must be one of: Normal, Emergency, Delayed' });
  }

  try {
    const result = await pool.query(
      'UPDATE appointments SET priority_level = $1 WHERE id = $2 RETURNING *',
      [priority_level, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { appointment_time } = req.body;

  if (!appointment_time) {
    return res.status(400).json({ message: 'appointment_time is required' });
  }

  try {
    const current = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    const oldApt = current.rows[0];
    const allowedStatuses = new Set(['Requested', 'Confirmed']);
    if (!allowedStatuses.has(oldApt.status)) {
      return res.status(400).json({ message: 'Only Requested or Confirmed appointments can be rescheduled' });
    }

    const result = await pool.query(
      `
        UPDATE appointments
        SET appointment_time = $1, status = 'Requested'
        WHERE id = $2
        RETURNING *
      `,
      [appointment_time, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('Daily patient limit reached')) {
      return res.status(400).json({ error: 'Doctor has reached the maximum patient limit for this day.' });
    }
    res.status(500).json({ error: err.message });
  }
};
