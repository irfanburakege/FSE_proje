const { pool } = require('../config/db');

const DEFAULT_SETTINGS = {
  clinic_name: 'Central Hospital Izmir',
  contact_email: 'admin@centralhospital.com',
  max_patients_per_doctor: 40,
  allow_online_booking: true,
  send_sms_alerts: true,
};

async function ensureSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      clinic_name VARCHAR(150) NOT NULL,
      contact_email VARCHAR(150) NOT NULL,
      max_patients_per_doctor INTEGER NOT NULL CHECK (max_patients_per_doctor > 0),
      allow_online_booking BOOLEAN NOT NULL DEFAULT TRUE,
      send_sms_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(
    `
      INSERT INTO app_settings (
        id, clinic_name, contact_email, max_patients_per_doctor, allow_online_booking, send_sms_alerts
      )
      VALUES (1, $1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `,
    [
      DEFAULT_SETTINGS.clinic_name,
      DEFAULT_SETTINGS.contact_email,
      DEFAULT_SETTINGS.max_patients_per_doctor,
      DEFAULT_SETTINGS.allow_online_booking,
      DEFAULT_SETTINGS.send_sms_alerts,
    ]
  );
}

exports.getSettings = async (req, res) => {
  try {
    await ensureSettingsTable();
    const result = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  const { clinicName, contactEmail, maxPatientsPerDoctor, allowOnlineBooking, sendSmsAlerts } = req.body;

  if (!clinicName || !String(clinicName).trim()) {
    return res.status(400).json({ message: 'clinicName is required' });
  }
  if (!contactEmail || !String(contactEmail).trim()) {
    return res.status(400).json({ message: 'contactEmail is required' });
  }

  const maxPatients = Number.parseInt(maxPatientsPerDoctor, 10);
  if (!Number.isInteger(maxPatients) || maxPatients <= 0) {
    return res.status(400).json({ message: 'maxPatientsPerDoctor must be a positive integer' });
  }

  const client = await pool.connect();
  try {
    await ensureSettingsTable();
    await client.query('BEGIN');

    await client.query(
      `
        UPDATE app_settings
        SET
          clinic_name = $1,
          contact_email = $2,
          max_patients_per_doctor = $3,
          allow_online_booking = $4,
          send_sms_alerts = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
      [String(clinicName).trim(), String(contactEmail).trim(), maxPatients, !!allowOnlineBooking, !!sendSmsAlerts]
    );

    // Keep doctor capacity in sync with global setting.
    await client.query('UPDATE doctors SET daily_patient_limit = $1', [maxPatients]);

    await client.query(
      `
        INSERT INTO audit_logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `,
      [
        null,
        'Updated Settings',
        `Clinic settings updated. maxPatientsPerDoctor=${maxPatients}, allowOnlineBooking=${!!allowOnlineBooking}, sendSmsAlerts=${!!sendSmsAlerts}`,
      ]
    );

    await client.query('COMMIT');

    const updated = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
