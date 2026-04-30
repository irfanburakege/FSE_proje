import React, { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    clinicName: 'Central Hospital Izmir',
    contactEmail: 'admin@centralhospital.com',
    maxPatientsPerDoctor: 40,
    allowOnlineBooking: true,
    sendSmsAlerts: true,
  });

  const handleSave = () => {
    // In a real app, this would be a POST request to the backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>⚙️ System Settings</h2>
          <p className="page-subtitle">Configure clinic defaults and application behavior</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Changes</button>
      </div>

      <div className="grid-2">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <h3>General Configuration</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Clinic Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={settings.clinicName} 
                onChange={e => setSettings({...settings, clinicName: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={settings.contactEmail} 
                onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Global Max Patients Per Doctor</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.maxPatientsPerDoctor} 
                onChange={e => setSettings({...settings, maxPatientsPerDoctor: parseInt(e.target.value)})} 
              />
            </div>
          </div>
        </div>

        {/* Features & Integrations */}
        <div className="card">
          <div className="card-header">
            <h3>Features & Integrations</h3>
          </div>
          <div className="card-body flex flex-col gap-16">
            <label className="flex items-center gap-12" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.allowOnlineBooking}
                onChange={e => setSettings({...settings, allowOnlineBooking: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 600 }}>Enable Online Patient Booking</span>
            </label>

            <label className="flex items-center gap-12" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.sendSmsAlerts}
                onChange={e => setSettings({...settings, sendSmsAlerts: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 600 }}>Send automated SMS Alerts for delays</span>
            </label>

            <hr className="mt-16 mb-16" style={{ borderColor: 'var(--border-light)' }} />

            <div className="form-group">
              <label className="form-label">SMS Gateway API Key</label>
              <input 
                type="password" 
                className="form-input" 
                value="••••••••••••••••" 
                readOnly
              />
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>Configured via environment variables on backend.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
