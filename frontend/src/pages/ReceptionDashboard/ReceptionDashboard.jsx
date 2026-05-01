/**
 * ReceptionDashboard — UC-02: Reception Desk Dashboard.
 * Real-time overview: stats, patient queue, doctor status board,
 * check-in, priority management, and manual appointment creation.
 */
import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { useModal } from '../../context/StoreContext.jsx';
import { useStoreEvents, PATIENT_FLOW_EVENTS } from '../../hooks/useStoreEvents.js';
import { getToday, formatTime, formatDate, formatDateShort, waitMinutes, getWeekdayDates } from '../../utils/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatCard from '../../components/StatCard.jsx';
import './ReceptionDashboard.css';

export default function ReceptionDashboard() {
  const { store, showToast } = useStore();
  const { showModal, closeModal } = useModal();

  useStoreEvents(PATIENT_FLOW_EVENTS);

  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [filterDeptID, setFilterDeptID] = useState('');
  const [filterDoctorID, setFilterDoctorID] = useState('');
  const itemsPerPage = 10;

  const departments = store.getDepartments();
  const doctors = store.getDoctors();
  const filteredDoctors = filterDeptID ? store.getDoctorsByDept(filterDeptID) : doctors;

  const allAppointments = store.getAppointments({ date: selectedDate })
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const allVisits = store.getVisits({ date: selectedDate });
  const allQueues = store.getAllQueues(selectedDate);

  const filteredAppointments = allAppointments.filter(a => {
    if (filterDeptID && store.getDepartment(a.departmentID)?.deptID !== filterDeptID) return false;
    if (filterDoctorID && a.doctorID !== filterDoctorID) return false;
    return true;
  });

  const filteredQueues = allQueues.filter(v => {
    const doc = store.getDoctor(v.doctorID);
    if (filterDeptID && doc?.departmentID !== filterDeptID) return false;
    if (filterDoctorID && v.doctorID !== filterDoctorID) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageStart = filteredAppointments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(filteredAppointments.length, currentPage * itemsPerPage);

  const queueTotalPages = Math.max(1, Math.ceil(filteredQueues.length / itemsPerPage));
  const paginatedQueues = filteredQueues.slice((queuePage - 1) * itemsPerPage, queuePage * itemsPerPage);
  const queueStart = filteredQueues.length === 0 ? 0 : (queuePage - 1) * itemsPerPage + 1;
  const queueEnd = Math.min(filteredQueues.length, queuePage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setQueuePage(1);
  }, [selectedDate, filterDeptID, filterDoctorID]);

  const stats = {
    total: allAppointments.length,
    waiting: allQueues.length,
    inConsultation: allVisits.filter(v => v.flowStatus === 'in-consultation').length,
    assessment: allVisits.filter(v => v.flowStatus === 'assessment').length,
    completed: allVisits.filter(v => v.flowStatus === 'completed').length,
    noShow: allVisits.filter(v => v.flowStatus === 'no-show').length,
  };

  /* ── Queue Manager Actions ── */
  const checkInPatient = async (appointmentID) => {
    const result = await store.checkInPatient(appointmentID);
    if (result.error) showToast(result.error, 'warning');
    else showToast('Patient checked in successfully!', 'success');
  };

  const setEmergencyPriority = async (visitID) => {
    const result = await store.setPriority(visitID, 'emergency');
    if (result?.error) showToast(result.error, 'error');
    else showToast('🚨 Patient flagged as EMERGENCY — moved to front of queue.', 'warning');
  };

  const setNormalPriority = async (visitID) => {
    const result = await store.setPriority(visitID, 'normal');
    if (result?.error) showToast(result.error, 'error');
    else showToast('Priority reset to normal.', 'info');
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
        <div className="flex gap-12 flex-wrap items-center mb-16">
          <button className="btn btn-outline" onClick={openRegisterPatient}>
            📝 Register Patient
          </button>
          <button className="btn btn-primary" id="manual-apt-btn" onClick={openManualAppointment}>
            ➕ Manual Appointment
          </button>
        </div>
        <div className="flex gap-12 flex-wrap items-center">
          <div className="flex items-center gap-8">
            <label className="form-label" style={{ margin: 0 }}>Date:</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 170 }}
            />
          </div>
          <div className="flex items-center gap-8">
            <label className="form-label" style={{ margin: 0 }}>Department:</label>
            <select
              className="form-select"
              value={filterDeptID}
              onChange={(e) => {
                const nextDept = e.target.value;
                setFilterDeptID(nextDept);
                if (nextDept && filterDoctorID && !store.getDoctorsByDept(nextDept).some(d => d.doctorID === filterDoctorID)) {
                  setFilterDoctorID('');
                }
              }}
              style={{ width: 180 }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.deptID} value={d.deptID}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-8">
            <label className="form-label" style={{ margin: 0 }}>Doctor:</label>
            <select
              className="form-select"
              value={filterDoctorID}
              onChange={(e) => setFilterDoctorID(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="">All Doctors</option>
              {filteredDoctors.map(d => <option key={d.doctorID} value={d.doctorID}>{d.name}</option>)}
            </select>
          </div>
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
            <span className="text-sm text-muted">{filteredQueues.length} in queue</span>
          </div>
          <div className="card-body queue-body">
            {filteredQueues.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p>Queue is empty — no patients currently waiting.</p>
              </div>
            ) : (
              <div className="queue-list">
                {paginatedQueues.map((visit, i) => {
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
          <div className="pagination-footer flex items-center justify-between mt-16">
            <span className="text-sm text-muted">Showing {queueStart}-{queueEnd} of {filteredQueues.length}</span>
            <div className="flex items-center gap-8">
              <button
                className="btn btn-outline btn-sm"
                disabled={queuePage === 1}
                onClick={() => setQueuePage(queuePage - 1)}
              >
                ← Prev
              </button>
              <span className="text-sm">Page {queuePage} / {queueTotalPages}</span>
              <button
                className="btn btn-outline btn-sm"
                disabled={queuePage === queueTotalPages}
                onClick={() => setQueuePage(queuePage + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Appointments Table */}
      <div className="card mt-24">
        <div className="card-header">
          <h3>📅 {selectedDate === today ? "All Today's Appointments" : `All ${formatDateShort(selectedDate)} Appointments`}</h3>
          <span className="text-sm text-muted">{filteredAppointments.length} appointments</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: 24 }}>{selectedDate === today ? 'No appointments for today' : `No appointments for ${formatDateShort(selectedDate)}`}</td></tr>
              ) : paginatedAppointments.map(apt => {
                const pat = store.getPatient(apt.patientID);
                const doc = store.getDoctor(apt.doctorID);
                const dept = store.getDepartment(apt.departmentID);
                const visit = allVisits.find(v => v.appointmentID === apt.appointmentID);
                const flowStatus = visit ? visit.flowStatus : (apt.status === 'no-show' ? 'no-show' : 'new-entry');
                const canCheckIn = !visit && ['requested'].includes(apt.status);

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
        <div className="pagination-footer flex items-center justify-between mt-16">
          <span className="text-sm text-muted">Showing {pageStart}-{pageEnd} of {filteredAppointments.length}</span>
          <div className="flex items-center gap-8">
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Prev
            </button>
            <span className="text-sm">Page {currentPage} / {totalPages}</span>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
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

  const handleCreate = async () => {
    if (!slotVal || !doctorID) {
      showToast('Please fill all fields.', 'warning');
      return;
    }
    const [timeSlot, endTime] = slotVal.split('|');
    const result = await store.createAppointment({
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
          <option value="">Select doctor...</option>
          {doctors.length === 0 ? (
            <option value="" disabled>Select department first</option>
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
          <option value="">Select time slot...</option>
          {slots.length === 0 ? (
            <option value="" disabled>{doctorID && date ? 'No available slots for selected doctor/date' : 'Select doctor & date first'}</option>
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
  const [nationalId, setNationalId] = useState('');
  const [dob, setDob] = useState('');

  const handleRegister = async () => {
    if (!name || !phone) {
      showToast('Name and Phone are required.', 'error');
      return;
    }
    const result = await store.createPatient({
      name,
      phone_number: phone,
      national_id: nationalId || null
    });
    if (result.error) {
      showToast(result.error, 'error');
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
        <label className="form-label">National ID</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="11-digit ID (optional)" 
          value={nationalId} 
          onChange={(e) => setNationalId(e.target.value)} 
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
