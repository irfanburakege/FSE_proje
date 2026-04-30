/**
 * ReceptionDashboard — UC-02: Reception Desk Dashboard.
 * Real-time overview: stats, patient queue, doctor status board,
 * check-in, priority management, and manual appointment creation.
 */
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { useModal } from '../../context/StoreContext.jsx';
import { useStoreEvents, PATIENT_FLOW_EVENTS } from '../../hooks/useStoreEvents.js';
import { getToday, formatTime, formatDate, waitMinutes, getWeekdayDates } from '../../utils/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatCard from '../../components/StatCard.jsx';
import './ReceptionDashboard.css';

export default function ReceptionDashboard() {
  const { store, showToast } = useStore();
  const { showModal, closeModal } = useModal();

  useStoreEvents(PATIENT_FLOW_EVENTS);

  const today = getToday();
  const stats = store.getDayStats(today);
  const allAppointments = store.getAppointments({ date: today })
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const allVisits = store.getVisits({ date: today });
  const allQueues = store.getAllQueues(today);
  const doctors = store.getDoctors();

  /* ── Queue Manager Actions ── */
  const checkInPatient = (appointmentID) => {
    const result = store.checkInPatient(appointmentID);
    if (result.error) showToast(result.error, 'warning');
    else showToast('Patient checked in successfully!', 'success');
  };

  const setEmergencyPriority = (visitID) => {
    store.setPriority(visitID, 'emergency');
    showToast('🚨 Patient flagged as EMERGENCY — moved to front of queue.', 'warning');
  };

  const setNormalPriority = (visitID) => {
    store.setPriority(visitID, 'normal');
    showToast('Priority reset to normal.', 'info');
  };

  const openManualAppointment = () => {
    showModal(
      <ManualAppointmentModal store={store} showToast={showToast} closeModal={closeModal} />
    );
  };

  const openRegisterPatient = () => {
    showModal(
      <RegisterPatientModal store={store} showToast={showToast} closeModal={closeModal} />
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🖥️ Reception Desk Dashboard</h2>
          <p className="page-subtitle">{formatDate(today)} — Real-time patient flow and queue monitoring</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-outline" onClick={openRegisterPatient}>
            📝 Register Patient
          </button>
          <button className="btn btn-primary" id="manual-apt-btn" onClick={openManualAppointment}>
            ➕ Manual Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard value={stats.total} label="Total Appointments" color="var(--primary)" />
        <StatCard value={stats.waiting} label="Waiting" color="var(--warning)" />
        <StatCard value={stats.inConsultation} label="In Consultation" color="var(--danger)" />
        <StatCard value={stats.assessment} label="Assessment" color="var(--purple)" />
        <StatCard value={stats.completed} label="Completed" color="var(--success)" />
        <StatCard value={stats.noShow} label="No Show" color="#6B7280" />
      </div>

      <div className="reception-layout">
        {/* Doctor Status Board */}
        <div className="card">
          <div className="card-header"><h3>👨‍⚕️ Doctor Status Board</h3></div>
          <div className="card-body doctor-status-grid">
            {doctors.map(doc => {
              const dept = store.getDepartment(doc.departmentID);
              const docVisits = allVisits.filter(v => v.doctorID === doc.doctorID);
              const inConsult = docVisits.find(v => v.flowStatus === 'in-consultation');
              const waiting = docVisits.filter(v => ['waiting', 'checked-in'].includes(v.flowStatus)).length;
              const completed = docVisits.filter(v => v.flowStatus === 'completed').length;
              const statusClass = inConsult ? 'busy' : waiting > 0 ? 'has-waiting' : 'free';
              const currentPat = inConsult ? store.getPatient(inConsult.patientID) : null;

              return (
                <div key={doc.doctorID} className={`doctor-status-card ${statusClass}`}>
                  <div className="ds-header">
                    <div className="ds-indicator" />
                    <strong>{doc.name}</strong>
                  </div>
                  <div className="ds-dept">{dept?.icon || ''} {dept?.name || ''}</div>
                  <div className="ds-details">
                    {inConsult ? (
                      <span className="ds-current">🩺 {currentPat?.name || 'Patient'}</span>
                    ) : (
                      <span className="ds-current free-text">Available</span>
                    )}
                    <span className="text-xs text-muted">⏳ {waiting} waiting · ✅ {completed} done</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Queue */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Patient Queue</h3>
            <span className="text-sm text-muted">{allQueues.length} in queue</span>
          </div>
          <div className="card-body queue-body">
            {allQueues.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p>Queue is empty — no patients currently waiting.</p>
              </div>
            ) : (
              <div className="queue-list">
                {allQueues.map((visit, i) => {
                  const pat = store.getPatient(visit.patientID);
                  const doc = store.getDoctor(visit.doctorID);
                  const dept = store.getDepartment(doc?.departmentID);
                  const isEmergency = visit.priority === 'emergency';

                  return (
                    <div key={visit.visitID} className={`queue-item ${isEmergency ? 'priority-emergency' : ''}`}>
                      <div className="qi-position">{i + 1}</div>
                      <div className="qi-info">
                        <strong>{pat?.name || 'Unknown'}</strong>
                        <span className="text-xs text-muted">{doc?.name || ''} · {dept?.name || ''}</span>
                      </div>
                      <div className="qi-meta">
                        <StatusBadge status={visit.flowStatus} />
                        <span className="text-xs text-muted">⏱ {waitMinutes(visit.checkInTime)}</span>
                      </div>
                      <div className="qi-actions">
                        {isEmergency ? (
                          <button className="btn btn-outline btn-xs" onClick={() => setNormalPriority(visit.visitID)} title="Remove emergency priority">
                            🔽 Normal
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-xs" onClick={() => setEmergencyPriority(visit.visitID)} title="Flag as emergency">
                            🚨 Emergency
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Appointments Table */}
      <div className="card mt-24">
        <div className="card-header">
          <h3>📅 All Today's Appointments</h3>
          <span className="text-sm text-muted">{allAppointments.length} appointments</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {allAppointments.map(apt => {
                const pat = store.getPatient(apt.patientID);
                const doc = store.getDoctor(apt.doctorID);
                const dept = store.getDepartment(apt.departmentID);
                const visit = allVisits.find(v => v.appointmentID === apt.appointmentID);
                const flowStatus = visit ? visit.flowStatus : (apt.status === 'no-show' ? 'no-show' : 'new-entry');
                const canCheckIn = !visit && apt.status === 'scheduled';

                return (
                  <tr key={apt.appointmentID}>
                    <td><strong>{formatTime(apt.timeSlot)}</strong></td>
                    <td>{pat?.name || 'Unknown'}</td>
                    <td>{doc?.name || 'N/A'}</td>
                    <td>{dept?.icon || ''} {dept?.name || ''}</td>
                    <td><StatusBadge status={flowStatus} /></td>
                    <td>
                      {canCheckIn ? (
                        <button className="btn btn-success btn-xs" onClick={() => checkInPatient(apt.appointmentID)}>
                          ✅ Check In
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Manual Appointment Modal ── */
function ManualAppointmentModal({ store, showToast, closeModal }) {
  const depts = store.getDepartments();
  const patients = store.getPatients();
  const [patientID, setPatientID] = useState(patients[0]?.patientID || '');
  const [deptID, setDeptID] = useState('');
  const [doctorID, setDoctorID] = useState('');
  const [date, setDate] = useState(getWeekdayDates(10)[0] || '');
  const [slotVal, setSlotVal] = useState('');

  const doctors = deptID ? store.getDoctorsByDept(deptID) : [];
  const slots = doctorID && date ? store.getAvailableSlots(doctorID, date).filter(s => s.isAvailable) : [];

  const handleDeptChange = (e) => {
    setDeptID(e.target.value);
    setDoctorID('');
    setSlotVal('');
  };

  const handleDoctorChange = (e) => {
    setDoctorID(e.target.value);
    setSlotVal('');
  };

  const handleCreate = () => {
    if (!slotVal || !doctorID) {
      showToast('Please fill all fields.', 'warning');
      return;
    }
    const [timeSlot, endTime] = slotVal.split('|');
    const result = store.createAppointment({
      patientID,
      doctorID,
      departmentID: deptID,
      date,
      timeSlot,
      endTime,
    });
    if (result.error) showToast(result.error, 'error');
    else {
      showToast('Appointment created!', 'success');
      closeModal();
    }
  };

  return (
    <>
      <div className="modal-title">➕ Create Manual Appointment</div>

      <div className="form-group">
        <label className="form-label">Patient</label>
        <select className="form-select" value={patientID} onChange={(e) => setPatientID(e.target.value)}>
          {patients.map(p => <option key={p.patientID} value={p.patientID}>{p.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Department</label>
        <select className="form-select" value={deptID} onChange={handleDeptChange}>
          <option value="">Select...</option>
          {depts.map(d => <option key={d.deptID} value={d.deptID}>{d.icon} {d.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Doctor</label>
        <select className="form-select" value={doctorID} onChange={handleDoctorChange}>
          {doctors.length === 0 ? (
            <option value="">Select department first</option>
          ) : (
            doctors.map(d => <option key={d.doctorID} value={d.doctorID}>{d.name}</option>)
          )}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Date</label>
        <select className="form-select" value={date} onChange={(e) => { setDate(e.target.value); setSlotVal(''); }}>
          {getWeekdayDates(10).map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Time Slot</label>
        <select className="form-select" value={slotVal} onChange={(e) => setSlotVal(e.target.value)}>
          {slots.length === 0 ? (
            <option value="">Select doctor & date first</option>
          ) : (
            slots.map(s => (
              <option key={s.startTime} value={`${s.startTime}|${s.endTime}`}>
                {formatTime(s.startTime)} — {formatTime(s.endTime)}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex gap-8 mt-16">
        <button className="btn btn-primary" onClick={handleCreate}>Create Appointment</button>
        <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
      </div>
    </>
  );
}

/* ── Register Patient Modal (For Form Fill-in Screenshot) ── */
function RegisterPatientModal({ store, showToast, closeModal }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');

  const handleRegister = () => {
    if (!name || !phone) {
      showToast('Name and Phone are required.', 'error');
      return;
    }
    showToast(`Patient ${name} registered successfully!`, 'success');
    closeModal();
  };

  return (
    <>
      <div className="modal-title">📝 Register New Patient</div>
      <p className="text-muted text-sm mb-16">Enter patient details into the system.</p>

      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="e.g. Ahmet Yılmaz" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number *</label>
        <input 
          type="tel" 
          className="form-input" 
          placeholder="05XX XXX XX XX" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input 
          type="email" 
          className="form-input" 
          placeholder="ahmet@example.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Date of Birth</label>
        <input 
          type="date" 
          className="form-input" 
          value={dob} 
          onChange={(e) => setDob(e.target.value)} 
        />
      </div>

      <div className="flex gap-8 mt-24">
        <button className="btn btn-primary" onClick={handleRegister}>Register Patient</button>
        <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
      </div>
    </>
  );
}
