/**
 * StatusBadge — Renders a styled status badge with icon and label.
 * Replaces the statusBadge() HTML string utility from the prototype.
 */
import React from 'react';
import { FLOW_STATUSES, APPOINTMENT_STATUSES } from '../utils/utils.js';

export default function StatusBadge({ status, type = 'flow' }) {
  const map = type === 'appointment' ? APPOINTMENT_STATUSES : FLOW_STATUSES;
  const s = map[status] || { label: status, color: '#6B7280', icon: '❓' };

  return (
    <span
      className="status-badge"
      style={{
        '--badge-color': s.color,
        '--badge-bg': s.bg || s.color + '20',
      }}
    >
      {s.icon || ''} {s.label}
    </span>
  );
}
