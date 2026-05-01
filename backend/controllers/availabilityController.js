const { pool } = require('../config/db');

const DEFAULT_WEEKLY_SCHEDULE = [
  { day_of_week: 1, work_start: '09:00', work_end: '17:00', break_start: '12:00', break_end: '13:00', is_off: false },
  { day_of_week: 2, work_start: '09:00', work_end: '17:00', break_start: '12:00', break_end: '13:00', is_off: false },
  { day_of_week: 3, work_start: '09:00', work_end: '17:00', break_start: '12:00', break_end: '13:00', is_off: false },
  { day_of_week: 4, work_start: '09:00', work_end: '17:00', break_start: '12:00', break_end: '13:00', is_off: false },
  { day_of_week: 5, work_start: '09:00', work_end: '17:00', break_start: '12:00', break_end: '13:00', is_off: false },
  { day_of_week: 6, work_start: null, work_end: null, break_start: null, break_end: null, is_off: true },
  { day_of_week: 0, work_start: null, work_end: null, break_start: null, break_end: null, is_off: true },
];

async function ensureDoctorSchedulesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      work_start TIME NULL,
      work_end TIME NULL,
      break_start TIME NULL,
      break_end TIME NULL,
      is_off BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (doctor_id, day_of_week)
    )
  `);
}

async function ensureDefaultScheduleForDoctor(doctorId) {
  await ensureDoctorSchedulesTable();
  for (const row of DEFAULT_WEEKLY_SCHEDULE) {
    await pool.query(
      `
        INSERT INTO doctor_schedules (
          doctor_id, day_of_week, work_start, work_end, break_start, break_end, is_off
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (doctor_id, day_of_week) DO NOTHING
      `,
      [doctorId, row.day_of_week, row.work_start, row.work_end, row.break_start, row.break_end, row.is_off]
    );
  }
}

exports.getDoctorAvailability = async (req, res) => {
  const doctorId = Number.parseInt(req.params.doctorId, 10);
  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    return res.status(400).json({ message: 'doctorId must be a positive integer' });
  }

  try {
    await ensureDefaultScheduleForDoctor(doctorId);
    const result = await pool.query(
      `
        SELECT
          day_of_week,
          work_start::text AS work_start,
          work_end::text AS work_end,
          break_start::text AS break_start,
          break_end::text AS break_end,
          is_off
        FROM doctor_schedules
        WHERE doctor_id = $1
        ORDER BY day_of_week ASC
      `,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDoctorAvailability = async (req, res) => {
  const doctorId = Number.parseInt(req.params.doctorId, 10);
  const { schedule } = req.body;

  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    return res.status(400).json({ message: 'doctorId must be a positive integer' });
  }
  if (!Array.isArray(schedule) || schedule.length !== 7) {
    return res.status(400).json({ message: 'schedule must include 7 day records' });
  }

  const client = await pool.connect();
  try {
    await ensureDoctorSchedulesTable();
    await client.query('BEGIN');

    for (const row of schedule) {
      const day = Number.parseInt(row.day_of_week, 10);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error('day_of_week must be between 0 and 6');
      }
      const isOff = !!row.is_off;
      await client.query(
        `
          INSERT INTO doctor_schedules (
            doctor_id, day_of_week, work_start, work_end, break_start, break_end, is_off, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          ON CONFLICT (doctor_id, day_of_week)
          DO UPDATE SET
            work_start = EXCLUDED.work_start,
            work_end = EXCLUDED.work_end,
            break_start = EXCLUDED.break_start,
            break_end = EXCLUDED.break_end,
            is_off = EXCLUDED.is_off,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          doctorId,
          day,
          isOff ? null : row.work_start || null,
          isOff ? null : row.work_end || null,
          isOff ? null : row.break_start || null,
          isOff ? null : row.break_end || null,
          isOff,
        ]
      );
    }

    await client.query(
      `
        INSERT INTO audit_logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `,
      [null, 'Updated Doctor Availability', `Doctor ${doctorId} weekly schedule updated`]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
