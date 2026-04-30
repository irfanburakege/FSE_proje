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
import Placeholder from './pages/Placeholder.jsx';

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
              <Route path="/availability" element={<Placeholder />} />
              <Route path="/reports" element={<Placeholder />} />
              <Route path="/notifications" element={<Placeholder />} />
              <Route path="/audit" element={<Placeholder />} />
              <Route path="/settings" element={<Placeholder />} />
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
