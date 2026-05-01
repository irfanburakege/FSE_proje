import React, { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/StatCard.jsx';
import { apiClient } from '../../api/client.js';
import { useStore } from '../../context/StoreContext.jsx';
import './ReportsDashboard.css';

export default function ReportsDashboard() {
  const { showToast } = useStore();
  const [period, setPeriod] = useState('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState({
    totalAppointments: 0,
    averageWaitMinutes: null,
    noShowRate: 0,
    patientSatisfaction: 0,
    targetWaitAchievement: 0,
    measuredWaitSampleSize: 0,
    departmentVolume: [],
  });

  const colorPalette = ['var(--primary)', 'var(--purple)', 'var(--accent)', 'var(--success)', 'var(--danger)'];

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get(`/stats/report?period=${period}`);
        setReport({
          totalAppointments: data.totalAppointments || 0,
          averageWaitMinutes: data.averageWaitMinutes,
          noShowRate: data.noShowRate || 0,
          patientSatisfaction: data.patientSatisfaction || 0,
          targetWaitAchievement: data.targetWaitAchievement || 0,
          measuredWaitSampleSize: data.measuredWaitSampleSize || 0,
          departmentVolume: Array.isArray(data.departmentVolume) ? data.departmentVolume : [],
        });
      } catch (err) {
        showToast(`Report could not be loaded: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [period, showToast]);

  const avgWaitLabel = report.averageWaitMinutes == null
    ? 'N/A'
    : `${Math.round(report.averageWaitMinutes)} min`;

  const noShowRateLabel = `${report.noShowRate.toFixed(1)}%`;
  const satisfactionLabel = `${report.patientSatisfaction.toFixed(1)}%`;

  const departmentRows = useMemo(
    () =>
      report.departmentVolume.map((dept, idx) => ({
        name: dept.department_name,
        count: dept.count,
        percentage: dept.percentage,
        color: colorPalette[idx % colorPalette.length],
      })),
    [report.departmentVolume]
  );

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
        <StatCard value={isLoading ? '...' : report.totalAppointments} label="Total Appointments" color="var(--primary)" />
        <StatCard value={isLoading ? '...' : avgWaitLabel} label="Avg Wait Time" color="var(--warning)" />
        <StatCard value={isLoading ? '...' : noShowRateLabel} label="No-Show Rate" color="var(--danger)" />
        <StatCard value={isLoading ? '...' : satisfactionLabel} label="Patient Satisfaction" color="var(--success)" />
      </div>

      <div className="reports-grid">
        {/* Department Volume Chart */}
        <div className="report-card">
          <div className="report-header">Appointments by Department</div>
          <div className="bar-chart">
            {!isLoading && departmentRows.length === 0 && (
              <p className="text-muted">No appointment data for selected period.</p>
            )}
            {departmentRows.map(dept => (
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
          <div className="metric-highlight">{isLoading ? '...' : avgWaitLabel}</div>
          <p className="metric-subtitle">
            {report.measuredWaitSampleSize > 0
              ? `Based on ${report.measuredWaitSampleSize} completed check-in to consultation records in selected period.`
              : 'No sufficient wait-time measurements found for selected period.'}
          </p>
          
          <div className="mt-24">
            <div className="bar-item">
              <div className="bar-label">
                <span>Target Wait Time (&lt;15m)</span>
                <span>{isLoading ? '...' : `${report.targetWaitAchievement.toFixed(1)}% achieved`}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, report.targetWaitAchievement))}%`, background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
