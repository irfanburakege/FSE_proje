import React from 'react';

export default function AuditLog() {
  const mockLogs = [
    { id: 101, user: 'Admin (System)', action: 'Updated Settings', details: 'Changed max daily patient limit from 40 to 45.', time: '2026-05-01 09:12' },
    { id: 102, user: 'Receptionist Sarah', action: 'Patient Check-in', details: 'Checked in John Doe for DOC-01.', time: '2026-05-01 08:45' },
    { id: 103, user: 'Dr. Smith', action: 'Consultation Complete', details: 'Finished consultation for visit V-001.', time: '2026-05-01 08:30' },
    { id: 104, user: 'Patient App', action: 'New Appointment', details: 'Jane Roe booked an appointment online.', time: '2026-05-01 07:15' },
    { id: 105, user: 'System Task', action: 'Daily Backup', details: 'Database backup completed successfully.', time: '2026-05-01 00:00' },
  ];

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>📝 System Audit Log</h2>
          <p className="page-subtitle">Track all system events and user actions securely</p>
        </div>
        <div className="flex gap-8">
          <input type="text" className="form-input" placeholder="Search logs..." style={{ width: '200px' }} />
          <button className="btn btn-primary">Filter</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User / Source</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.time}</td>
                  <td><strong>{log.user}</strong></td>
                  <td><span className="status-badge" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{log.action}</span></td>
                  <td className="text-muted">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
