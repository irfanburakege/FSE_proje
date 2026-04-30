/**
 * App — Root layout with sidebar and React Router routes.
 */
import React from 'react';
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
