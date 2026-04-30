/**
 * PatientPortal — UC-01: Patient Books an Appointment.
 * Contains: Patient selector, tab switching (Book / My Appointments).
 */
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { useStoreEvents, APPOINTMENT_EVENTS } from '../../hooks/useStoreEvents.js';
import AppointmentForm from './AppointmentForm.jsx';
import MyAppointments from './MyAppointments.jsx';
import './PatientPortal.css';

export default function PatientPortal() {
  const { store } = useStore();
  const [tab, setTab] = useState('book');

  useStoreEvents(APPOINTMENT_EVENTS);

  const currentPatientID = store.getCurrentPatientID();
  const patients = store.getPatients();

  const handlePatientChange = (e) => {
    store.setCurrentPatient(e.target.value);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>📋 Patient Portal</h2>
          <p className="page-subtitle">Book, reschedule, or cancel your appointments</p>
        </div>
        <div className="flex items-center gap-12">
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Patient:</label>
          <select
            className="form-select"
            id="patient-select"
            style={{ width: 200 }}
            value={currentPatientID}
            onChange={handlePatientChange}
          >
            {patients.map(p => (
              <option key={p.patientID} value={p.patientID}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="patient-tabs">
        <button
          className={`tab-btn ${tab === 'book' ? 'active' : ''}`}
          onClick={() => setTab('book')}
        >
          📝 Book Appointment
        </button>
        <button
          className={`tab-btn ${tab === 'my' ? 'active' : ''}`}
          onClick={() => setTab('my')}
        >
          📋 My Appointments
        </button>
      </div>

      <div id="patient-tab-content">
        {tab === 'book' ? (
          <AppointmentForm onComplete={() => setTab('my')} />
        ) : (
          <MyAppointments onSwitchToBook={() => setTab('book')} />
        )}
      </div>
    </>
  );
}
