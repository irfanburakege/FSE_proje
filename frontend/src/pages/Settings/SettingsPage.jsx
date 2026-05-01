import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
import { useStore } from '../../context/StoreContext.jsx';

export default function SettingsPage() {
  const { showToast } = useStore();
  const [settings, setSettings] = useState({
    clinicName: 'Central Hospital Izmir',
    contactEmail: 'admin@centralhospital.com',
    maxPatientsPerDoctor: 40,
    allowOnlineBooking: true,
    sendSmsAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get('/settings');
        setSettings({
          clinicName: data.clinic_name || '',
          contactEmail: data.contact_email || '',
          maxPatientsPerDoctor: data.max_patients_per_doctor || 1,
          allowOnlineBooking: !!data.allow_online_booking,
          sendSmsAlerts: !!data.send_sms_alerts,
        });
      } catch (err) {
        showToast(`Settings could not be loaded: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [showToast]);

  const handleSave = async () => {
    const maxPatients = Number.parseInt(settings.maxPatientsPerDoctor, 10);
    if (!settings.clinicName?.trim() || !settings.contactEmail?.trim()) {
      showToast('Clinic name and contact email are required.', 'warning');
      return;
    }
    if (!Number.isInteger(maxPatients) || maxPatients <= 0) {
      showToast('Max patients per doctor must be a positive number.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await apiClient.put('/settings', {
        clinicName: settings.clinicName.trim(),
        contactEmail: settings.contactEmail.trim(),
        maxPatientsPerDoctor: maxPatients,
        allowOnlineBooking: settings.allowOnlineBooking,
        sendSmsAlerts: settings.sendSmsAlerts,
      });

      setSettings({
        clinicName: updated.clinic_name || settings.clinicName,
        contactEmail: updated.contact_email || settings.contactEmail,
        maxPatientsPerDoctor: updated.max_patients_per_doctor || maxPatients,
        allowOnlineBooking: !!updated.allow_online_booking,
        sendSmsAlerts: !!updated.send_sms_alerts,
      });
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      showToast(`Settings save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>⚙️ System Settings</h2>
          <p className="page-subtitle">Configure clinic defaults and application behavior</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={isLoading || isSaving}>
          {isSaving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {isLoading && <p className="text-muted">Loading settings...</p>}

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
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={settings.contactEmail} 
                onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Global Max Patients Per Doctor</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.maxPatientsPerDoctor} 
                min={1}
                onChange={e => setSettings({...settings, maxPatientsPerDoctor: e.target.value})}
                disabled={isLoading || isSaving}
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
                disabled={isLoading || isSaving}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 600 }}>Enable Online Patient Booking</span>
            </label>

            <label className="flex items-center gap-12" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.sendSmsAlerts}
                onChange={e => setSettings({...settings, sendSmsAlerts: e.target.checked})}
                disabled={isLoading || isSaving}
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
