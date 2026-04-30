/**
 * Placeholder — Generic placeholder for unimplemented features.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';

const PLACEHOLDER_INFO = {
  '/availability':  { title: 'Doctor Availability Management', icon: '📅', desc: 'Allows doctors to define and edit their working hours, breaks, and unavailable periods.' },
  '/reports':       { title: 'Administrative Reporting',       icon: '📊', desc: 'Generates reports on appointment volumes, average waiting times, no-show rates, and clinic workload.' },
  '/notifications': { title: 'Notifications & Alerts',         icon: '🔔', desc: 'Notifies patients of appointment confirmations, delays, or cancellations. Alerts clinic staff of scheduling conflicts.' },
  '/audit':         { title: 'Audit Log',                      icon: '📝', desc: 'Maintains comprehensive audit logs of all significant system activities for traceability and compliance.' },
  '/settings':      { title: 'System Settings & RBAC',         icon: '⚙️', desc: 'Enforces role-based access control and manages system configuration, user accounts, and data privacy.' },
};

export default function Placeholder() {
  const location = useLocation();
  const info = PLACEHOLDER_INFO[location.pathname] || { title: 'Unknown', icon: '❓', desc: '' };

  return (
    <div className="placeholder-view">
      <div className="placeholder-card">
        <div className="placeholder-icon">{info.icon}</div>
        <h2>{info.title}</h2>
        <p>{info.desc}</p>
        <div className="placeholder-badge">
          <span className="construction-icon">🚧</span>
          <span>This function has not been implemented yet.</span>
        </div>
        <p className="placeholder-note">This feature is planned for a future release of the Smart Clinic system.</p>
      </div>
    </div>
  );
}
