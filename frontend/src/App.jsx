/**
 * App — Root layout with sidebar and React Router routes.
 */
import React, { useState, useEffect } from 'react';
import { store } from './store/store.js';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import Modal from './components/Modal.jsx';

import PatientPortal from './pages/PatientPortal/PatientPortal.jsx';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard.jsx';
import ReceptionDashboard from './pages/ReceptionDashboard/ReceptionDashboard.jsx';
import DoctorAvailability from './pages/Availability/DoctorAvailability.jsx';
import ReportsDashboard from './pages/Reports/ReportsDashboard.jsx';
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx';
import AuditLog from './pages/AuditLog/AuditLog.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    store.fetchAllData()
      .then(() => setIsReady(true))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
        <h2>Error connecting to backend API: {error}</h2>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ marginTop: '20px', color: 'var(--text-main)' }}>Sistem Yükleniyor...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Veritabanına bağlanılıyor</p>
      </div>
    );
  }

  return (
    <>
      <div id="app">
        <Sidebar />
        <main id="main-content">
          <div id="view-container">
            <Routes>
              <Route path="/patient" element={<PatientPortal />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/reception" element={<ReceptionDashboard />} />
              <Route path="/availability" element={<DoctorAvailability />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/patient" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <Toast />
      <Modal />
    </>
  );
}
