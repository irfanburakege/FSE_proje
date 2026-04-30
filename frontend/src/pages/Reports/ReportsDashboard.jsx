import React, { useState } from 'react';
import StatCard from '../../components/StatCard.jsx';
import { getToday, formatDate } from '../../utils/utils.js';
import './ReportsDashboard.css';

export default function ReportsDashboard() {
  // Mock Data for Backend Integration
  const [period, setPeriod] = useState('weekly');
  
  const mockStats = {
    totalAppointments: 1245,
    averageWaitTime: '18 min',
    noShowRate: '4.2%',
    patientSatisfaction: '96%',
  };

  const mockDepartmentVolume = [
    { name: 'Cardiology', count: 420, color: 'var(--primary)', percentage: 85 },
    { name: 'Neurology', count: 310, color: 'var(--purple)', percentage: 65 },
    { name: 'Dermatology', count: 280, color: 'var(--accent)', percentage: 55 },
    { name: 'Pediatrics', count: 185, color: 'var(--success)', percentage: 40 },
    { name: 'Emergency', count: 50, color: 'var(--danger)', percentage: 15 },
  ];

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>📊 Administrative Reporting</h2>
          <p className="page-subtitle">Analyze clinic performance and patient flow metrics</p>
        </div>
        <div>
          <select 
            className="form-select" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="stats-grid">
        <StatCard value={mockStats.totalAppointments} label="Total Appointments" color="var(--primary)" />
        <StatCard value={mockStats.averageWaitTime} label="Avg Wait Time" color="var(--warning)" />
        <StatCard value={mockStats.noShowRate} label="No-Show Rate" color="var(--danger)" />
        <StatCard value={mockStats.patientSatisfaction} label="Patient Satisfaction" color="var(--success)" />
      </div>

      <div className="reports-grid">
        {/* Department Volume Chart */}
        <div className="report-card">
          <div className="report-header">Appointments by Department</div>
          <div className="bar-chart">
            {mockDepartmentVolume.map(dept => (
              <div key={dept.name} className="bar-item">
                <div className="bar-label">
                  <span>{dept.name}</span>
                  <span>{dept.count} pts</span>
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${dept.percentage}%`, background: dept.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wait Time Analysis */}
        <div className="report-card">
          <div className="report-header">Wait Time Analysis</div>
          <div className="metric-highlight">18 mins</div>
          <p className="metric-subtitle">
            Average wait time across all departments has <strong>decreased by 12%</strong> compared to the previous period. The highest wait times are currently observed in Neurology during the morning sessions.
          </p>
          
          <div className="mt-24">
            <div className="bar-item">
              <div className="bar-label">
                <span>Target Wait Time (&lt;15m)</span>
                <span>78% achieved</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '78%', background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
