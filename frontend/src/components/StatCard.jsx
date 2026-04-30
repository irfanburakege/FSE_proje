/**
 * StatCard — Reusable statistic card component with colored left border.
 */
import React from 'react';

export default function StatCard({ value, label, color = 'var(--primary)' }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
