import React, { useEffect, useMemo, useState } from 'react';
import './NotificationsPage.css';
import { apiClient } from '../../api/client.js';
import { useStore } from '../../context/StoreContext.jsx';

export default function NotificationsPage() {
  const { showToast } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'system',
    title: '',
    message: '',
  });

  const iconByType = {
    email: '📧',
    sms: '📱',
    system: '🚨',
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/notifications?limit=100');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(`Notifications could not be loaded: ${err.message}`, 'error');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSendAlert = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Title and message are required.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await apiClient.post('/notifications', {
        type: form.type,
        title: form.title.trim(),
        message: form.message.trim(),
      });
      setNotifications((prev) => [created, ...prev]);
      setForm({ type: 'system', title: '', message: '' });
      setShowForm(false);
      showToast('Manual alert sent successfully.', 'success');
    } catch (err) {
      showToast(`Manual alert failed: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = useMemo(
    () =>
      notifications.map((notif) => ({
        ...notif,
        icon: iconByType[notif.type] || '🔔',
        time: notif.created_at ? new Date(notif.created_at).toLocaleString() : '-',
      })),
    [notifications]
  );

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>🔔 Notifications & Alerts</h2>
          <p className="page-subtitle">Communication logs for patients and staff alerts</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowForm((prev) => !prev)} disabled={isSubmitting}>
          {showForm ? 'Close Form' : 'Send Manual Alert'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ display: 'grid', gap: '10px' }}>
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              disabled={isSubmitting}
            >
              <option value="system">System</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <input
              type="text"
              className="form-input"
              placeholder="Alert title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              disabled={isSubmitting}
            />
            <textarea
              className="form-input"
              placeholder="Alert message"
              rows={3}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              disabled={isSubmitting}
            />
            <button className="btn btn-primary" onClick={handleSendAlert} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Alert'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Recent Communications</h3>
        </div>
        <div className="inbox-list">
          {isLoading && <div className="inbox-item"><div className="inbox-content"><div className="inbox-message">Loading notifications...</div></div></div>}
          {!isLoading && rows.length === 0 && <div className="inbox-item"><div className="inbox-content"><div className="inbox-message">No notifications yet.</div></div></div>}
          {!isLoading && rows.map(notif => (
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
