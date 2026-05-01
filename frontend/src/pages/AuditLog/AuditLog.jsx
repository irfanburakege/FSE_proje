import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../api/client.js';
import { useStore } from '../../context/StoreContext.jsx';

export default function AuditLog() {
  const { showToast } = useStore();
  const [logs, setLogs] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async (searchText = '') => {
    try {
      setIsLoading(true);
      const query = searchText?.trim()
        ? `/audit-logs?search=${encodeURIComponent(searchText.trim())}&limit=200`
        : '/audit-logs?limit=200';
      const data = await apiClient.get(query);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(`Audit logs could not be loaded: ${err.message}`, 'error');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs('');
  }, []);

  const handleFilter = () => {
    setActiveSearch(searchInput);
    loadLogs(searchInput);
  };

  const handleClear = () => {
    setSearchInput('');
    setActiveSearch('');
    loadLogs('');
  };

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        time: log.timestamp ? new Date(log.timestamp).toLocaleString() : '-',
        user: log.user_name || 'System',
        action: log.action || '-',
        details: log.details || '-',
      })),
    [logs]
  );

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>📝 System Audit Log</h2>
          <p className="page-subtitle">Track all system events and user actions securely</p>
        </div>
        <div className="flex gap-8">
          <input
            type="text"
            className="form-input"
            placeholder="Search logs..."
            style={{ width: '220px' }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFilter();
            }}
          />
          <button className="btn btn-primary" onClick={handleFilter} disabled={isLoading}>
            Filter
          </button>
          <button className="btn btn-secondary" onClick={handleClear} disabled={isLoading}>
            Clear
          </button>
        </div>
      </div>

      <div className="card">
        {activeSearch && (
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <p className="text-muted">Filtered by: "{activeSearch}"</p>
          </div>
        )}
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
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-muted">Loading audit logs...</td>
                </tr>
              )}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted">No audit log found.</td>
                </tr>
              )}

              {!isLoading && rows.map(log => (
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
