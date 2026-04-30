import React from 'react';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const mockNotifications = [
    { id: 1, type: 'email', title: 'Appointment Confirmation: John Doe', message: 'Email sent successfully to john.doe@example.com for cardiology appointment on May 12.', time: '10 mins ago', icon: '📧' },
    { id: 2, type: 'sms', title: 'Delay Alert: Dr. Smith', message: 'SMS sent to 4 patients: "Dr. Smith is experiencing a 30-minute delay. We apologize for the inconvenience."', time: '1 hour ago', icon: '📱' },
    { id: 3, type: 'system', title: 'Queue Priority Override', message: 'System alert: Patient Jane Roe was escalated to EMERGENCY priority in the Emergency Department.', time: '2 hours ago', icon: '🚨' },
    { id: 4, type: 'email', title: 'Appointment Cancellation: Mark Lee', message: 'Cancellation confirmation email sent to mark.lee@example.com.', time: 'Yesterday', icon: '📧' },
  ];

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>🔔 Notifications & Alerts</h2>
          <p className="page-subtitle">Communication logs for patients and staff alerts</p>
        </div>
        <button className="btn btn-outline">Send Manual Alert</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Communications</h3>
        </div>
        <div className="inbox-list">
          {mockNotifications.map(notif => (
            <div key={notif.id} className="inbox-item">
              <div className="inbox-icon">{notif.icon}</div>
              <div className="inbox-content">
                <div className="inbox-header">
                  <div className="inbox-title">{notif.title}</div>
                  <div className="inbox-time">{notif.time}</div>
                </div>
                <div className="inbox-message">{notif.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
