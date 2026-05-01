const { pool } = require('../config/db');

function getPeriodRange(period) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    startDate.setDate(startDate.getDate() - 6);
  } else if (period === 'monthly') {
    startDate.setDate(1);
  } else if (period === 'yearly') {
    startDate.setMonth(0, 1);
  }

  return { startDate, endDate };
}

exports.getDailyStats = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const statsQuery = `
      SELECT 
        COUNT(a.id) as total,
        COUNT(a.id) FILTER (WHERE a.status = 'Requested') as scheduled,
        COUNT(a.id) FILTER (WHERE a.status = 'Completed') as completed,
        COUNT(a.id) FILTER (WHERE a.status = 'In Consultation') as inConsultation,
        COUNT(a.id) FILTER (WHERE a.status IN ('Waiting', 'Confirmed')) as waiting,
        COUNT(a.id) FILTER (WHERE a.status = 'No-Show') as noShow,
        COUNT(a.id) FILTER (WHERE a.status = 'Assessment') as assessment
      FROM appointments a
      WHERE DATE(a.appointment_time) = $1
    `;
    const result = await pool.query(statsQuery, [date]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportStats = async (req, res) => {
  const period = req.query.period || 'weekly';
  const validPeriods = new Set(['daily', 'weekly', 'monthly', 'yearly']);

  if (!validPeriods.has(period)) {
    return res.status(400).json({ message: 'period must be one of: daily, weekly, monthly, yearly' });
  }

  const { startDate, endDate } = getPeriodRange(period);

  try {
    const totalsQuery = `
      SELECT
        COUNT(a.id) AS total_appointments,
        COUNT(a.id) FILTER (WHERE a.status = 'No-Show') AS no_show_count,
        COUNT(a.id) FILTER (WHERE a.status = 'Completed') AS completed_count
      FROM appointments a
      WHERE a.appointment_time >= $1 AND a.appointment_time <= $2
    `;

    const waitQuery = `
      SELECT
        AVG(EXTRACT(EPOCH FROM (pf.consultation_start - pf.check_in_time)) / 60.0) AS average_wait_minutes,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (pf.consultation_start - pf.check_in_time)) / 60.0 <= 15) AS within_target,
        COUNT(*) AS measured_count
      FROM patient_flow pf
      JOIN appointments a ON a.id = pf.appointment_id
      WHERE
        a.appointment_time >= $1 AND a.appointment_time <= $2
        AND pf.check_in_time IS NOT NULL
        AND pf.consultation_start IS NOT NULL
    `;

    const departmentQuery = `
      SELECT
        dep.id AS department_id,
        dep.name AS department_name,
        COUNT(a.id) AS appointment_count
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      JOIN departments dep ON dep.id = d.department_id
      WHERE a.appointment_time >= $1 AND a.appointment_time <= $2
      GROUP BY dep.id, dep.name
      ORDER BY appointment_count DESC, dep.name ASC
    `;

    const [totalsResult, waitResult, departmentResult] = await Promise.all([
      pool.query(totalsQuery, [startDate, endDate]),
      pool.query(waitQuery, [startDate, endDate]),
      pool.query(departmentQuery, [startDate, endDate]),
    ]);

    const totals = totalsResult.rows[0] || {};
    const wait = waitResult.rows[0] || {};
    const totalAppointments = Number.parseInt(totals.total_appointments, 10) || 0;
    const noShowCount = Number.parseInt(totals.no_show_count, 10) || 0;
    const completedCount = Number.parseInt(totals.completed_count, 10) || 0;
    const measuredCount = Number.parseInt(wait.measured_count, 10) || 0;
    const withinTarget = Number.parseInt(wait.within_target, 10) || 0;
    const maxDeptCount = departmentResult.rows.reduce((max, row) => {
      const count = Number.parseInt(row.appointment_count, 10) || 0;
      return Math.max(max, count);
    }, 0);

    const departmentVolume = departmentResult.rows.map((row) => {
      const count = Number.parseInt(row.appointment_count, 10) || 0;
      const percentage = maxDeptCount > 0 ? Math.round((count / maxDeptCount) * 100) : 0;
      return {
        department_id: row.department_id,
        department_name: row.department_name,
        count,
        percentage,
      };
    });

    const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;
    const patientSatisfaction = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;
    const targetWaitAchievement = measuredCount > 0 ? (withinTarget / measuredCount) * 100 : 0;

    res.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalAppointments,
      averageWaitMinutes: wait.average_wait_minutes ? Number.parseFloat(wait.average_wait_minutes) : null,
      noShowRate,
      patientSatisfaction,
      targetWaitAchievement,
      measuredWaitSampleSize: measuredCount,
      departmentVolume,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
