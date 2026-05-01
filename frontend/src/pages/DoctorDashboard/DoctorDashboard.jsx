/**
 * DoctorDashboard — UC-03: Doctor Session Dashboard.
 * Displays daily schedule, patient list with status controls,
 * session info with patient limits, and consultation management.
 */
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { useStoreEvents, PATIENT_FLOW_EVENTS } from '../../hooks/useStoreEvents.js';
import { getToday, formatTime, formatDate, formatDateShort, waitMinutes } from '../../utils/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatCard from '../../components/StatCard.jsx';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const { store, showToast } = useStore();
  const [selectedDoctorID, setSelectedDoctorID] = useState(store.getDoctors()[0]?.doctorID || '');

  useStoreEvents(PATIENT_FLOW_EVENTS);

  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const doctor = store.getDoctor(selectedDoctorID);
  const dept = store.getDepartment(doctor?.departmentID);
  const schedule = store.getSchedule(selectedDoctorID, selectedDate);
  const appointments = store.getAppointments({ doctorID: selectedDoctorID, date: selectedDate })
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const visits = store.getVisits({ doctorID: selectedDoctorID, date: selectedDate });
  const inConsult = visits.find(v => v.flowStatus === 'in-consultation');
  const inAssess = visits.find(v => v.flowStatus === 'assessment');
  const completedCount = visits.filter(v => v.flowStatus === 'completed').length;
  const noShowCount = visits.filter(v => v.flowStatus === 'no-show').length;
  const waitingCount = visits.filter(v => ['waiting', 'checked-in'].includes(v.flowStatus)).length;

  /* ── Session Manager Actions ── */
  const startConsultation = async (visitID) => {
    const visit = store.getVisit(visitID);
    if (!visit) return showToast('Visit not found.', 'error');
    const currentConsult = store.getVisits({ doctorID: visit.doctorID, date: visit.date })
      .find(v => v.flowStatus === 'in-consultation' && v.visitID !== visitID);
    if (currentConsult) {
      return showToast('Doctor already has a patient in consultation. Complete current patient first.', 'warning');
    }
    const result = await store.updateVisitStatus(visitID, 'in-consultation');
    if (result.error) showToast(result.error, 'error');
    else showToast(`Consultation started for ${store.getPatient(visit.patientID)?.name || 'patient'}.`, 'info');
  };

  const moveToAssessment = async (visitID) => {
    const result = await store.updateVisitStatus(visitID, 'assessment');
    if (result.error) showToast(result.error, 'error');
    else showToast('Patient moved to assessment.', 'info');
  };

  const completeConsultation = async (visitID) => {
    const visit = store.getVisit(visitID);
    const result = await store.updateVisitStatus(visitID, 'completed');
    if (result.error) showToast(result.error, 'error');
    else {
      showToast('Consultation completed! ✅', 'success');
      if (visit) {
        const queue = store.getQueue(visit.doctorID, visit.date);
        const nextWaiting = queue.find(v => v.flowStatus === 'waiting');
        if (nextWaiting) {
          const pat = store.getPatient(nextWaiting.patientID);
          setTimeout(() => showToast(`Next patient ready: ${pat?.name || 'Unknown'}`, 'info'), 800);
        }
      }
    }
  };

  const markNoShow = async (visitID) => {
    const result = await store.updateVisitStatus(visitID, 'no-show');
    if (result.error) showToast(result.error, 'error');
    else showToast('Patient marked as No Show.', 'warning');
  };

  const markNoShowByAppointment = async (appointmentID) => {
    const result = await store.updateAppointmentStatus(appointmentID, 'no-show');
    if (result.error) showToast(result.error, 'error');
    else showToast('Patient marked as No Show.', 'warning');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🩺 Doctor Session Dashboard</h2>
          <p className="page-subtitle">{formatDate(selectedDate)} — Daily patient schedule and consultation management</p>
        </div>
      </div>

      <div className="flex items-center gap-12 mb-16" style={{ padding: '0 0 16px 0' }}>
        <label className="form-label" style={{ margin: 0 }}>Doctor:</label>
        <select
          className="form-select"
          id="doctor-select"
          style={{ width: 220 }}
          value={selectedDoctorID}
          onChange={(e) => setSelectedDoctorID(e.target.value)}
        >
          {store.getDoctors().map(d => {
            const dp = store.getDepartment(d.departmentID);
            return (
              <option key={d.doctorID} value={d.doctorID}>
                {d.name} — {dp?.name || ''}
              </option>
            );
          })}
        </select>

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

      {/* Session Stats */}
      <div className="stats-grid">
        <StatCard value={appointments.length} label="Total Patients" color="var(--primary)" />
        <StatCard value={waitingCount} label="Waiting" color="var(--warning)" />
        <StatCard value={inConsult ? 1 : 0} label="In Consultation" color="var(--danger)" />
        <StatCard value={completedCount} label="Completed" color="var(--success)" />
        <StatCard value={noShowCount} label="No Show" color="#6B7280" />
      </div>

      <div className="doctor-layout">
        {/* Session Info Card */}
        <div className="card session-info-card">
          <div className="card-header"><h3>📋 Session Info</h3></div>
          <div className="card-body">
            <div className="session-detail"><span>👨‍⚕️ Doctor</span><strong>{doctor?.name || 'N/A'}</strong></div>
            <div className="session-detail"><span>{dept?.icon || ''} Department</span><strong>{dept?.name || 'N/A'}</strong></div>
            <div className="session-detail"><span>🕐 Working Hours</span><strong>{schedule ? `${formatTime(schedule.workStart)} — ${formatTime(schedule.workEnd)}` : 'N/A'}</strong></div>
            <div className="session-detail"><span>☕ Break</span><strong>{schedule ? `${formatTime(schedule.breakStart)} — ${formatTime(schedule.breakEnd)}` : 'N/A'}</strong></div>
            <div className="session-detail">
              <span>👥 Patient Limit</span>
              <strong className={appointments.length >= (schedule?.maxPatients || 999) ? 'text-danger' : ''}>
                {appointments.length} / {schedule?.maxPatients || 'N/A'}
              </strong>
            </div>
            <div className="session-detail"><span>⏱️ Slot Duration</span><strong>{dept?.slotDuration || 'N/A'} min</strong></div>
          </div>
        </div>

        {/* Current Patient */}
        <div className="card current-patient-card">
          <div className="card-header"><h3>🔴 Current Patient</h3></div>
          <div className="card-body">
            {inConsult ? (() => {
              const pat = store.getPatient(inConsult.patientID);
              const apt = store.getAppointment(inConsult.appointmentID);
              return (
                <>
                  <div className="current-patient-info">
                    <div className="current-patient-avatar">{pat?.name?.charAt(0) || '?'}</div>
                    <div>
                      <h4>{pat?.name || 'Unknown'}</h4>
                      <p className="text-sm text-muted">Appointment: {apt ? formatTime(apt.timeSlot) : 'N/A'}</p>
                      <p className="text-sm text-muted">Duration: {inConsult.consultStartTime ? waitMinutes(inConsult.consultStartTime) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="current-patient-actions mt-16">
                    <button className="btn btn-warning btn-sm" onClick={() => moveToAssessment(inConsult.visitID)}>🔬 Send to Assessment</button>
                    <button className="btn btn-success btn-sm" onClick={() => completeConsultation(inConsult.visitID)}>✅ Complete</button>
                  </div>
                </>
              );
            })() : inAssess ? (() => {
              const pat = store.getPatient(inAssess.patientID);
              return (
                <>
                  <div className="current-patient-info">
                    <div className="current-patient-avatar assess">{pat?.name?.charAt(0) || '?'}</div>
                    <div>
                      <h4>{pat?.name || 'Unknown'}</h4>
                      <p className="text-sm text-muted">In Assessment</p>
                    </div>
                  </div>
                  <div className="current-patient-actions mt-16">
                    <button className="btn btn-success btn-sm" onClick={() => completeConsultation(inAssess.visitID)}>✅ Complete</button>
                  </div>
                </>
              );
            })() : (
              <div className="empty-state">
                <div className="empty-icon">🪑</div>
                <p>No patient in consultation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="card mt-24">
        <div className="card-header">
          <h3>📋 {selectedDate === today ? "Today's Patients" : `${formatDateShort(selectedDate)} Patients`}</h3>
          <span className="text-sm text-muted">{appointments.length} appointments</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Time</th><th>Patient</th><th>Status</th><th>Wait</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: 24 }}>{selectedDate === today ? 'No appointments for today' : `No appointments for ${formatDateShort(selectedDate)}`}</td></tr>
              ) : appointments.map((apt, i) => {
                const pat = store.getPatient(apt.patientID);
                const visit = visits.find(v => v.appointmentID === apt.appointmentID);
                const flowStatus = visit ? visit.flowStatus : (apt.status === 'no-show' ? 'no-show' : 'new-entry');
                const isWaiting = visit && ['waiting', 'checked-in'].includes(visit.flowStatus);
                const canStartConsult = isWaiting && !inConsult;

                return (
                  <tr key={apt.appointmentID} className={`${visit?.flowStatus === 'in-consultation' ? 'row-active' : ''} ${visit?.priority === 'emergency' ? 'row-emergency' : ''}`}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{formatTime(apt.timeSlot)}</strong><br />
                      <span className="text-xs text-muted">{formatTime(apt.endTime)}</span>
                    </td>
                    <td>
                      <strong>{pat?.name || 'Unknown'}</strong>
                      {visit?.priority === 'emergency' && <span className="priority-tag">🚨 EMERGENCY</span>}
                    </td>
                    <td><StatusBadge status={flowStatus} /></td>
                    <td className="text-sm">{visit?.checkInTime ? waitMinutes(visit.checkInTime) : '—'}</td>
                    <td>
                      <div className="flex gap-8">
                        {canStartConsult && <button className="btn btn-primary btn-xs" onClick={() => startConsultation(visit.visitID)}>🩺 Start</button>}
                        {visit?.flowStatus === 'in-consultation' && (
                          <>
                            <button className="btn btn-warning btn-xs" onClick={() => moveToAssessment(visit.visitID)}>🔬 Assess</button>
                            <button className="btn btn-success btn-xs" onClick={() => completeConsultation(visit.visitID)}>✅ Done</button>
                          </>
                        )}
                        {visit?.flowStatus === 'assessment' && <button className="btn btn-success btn-xs" onClick={() => completeConsultation(visit.visitID)}>✅ Done</button>}
                        {flowStatus === 'new-entry' && apt.status === 'requested' && <button className="btn btn-outline btn-xs" onClick={() => markNoShowByAppointment(apt.appointmentID)}>❌ No Show</button>}
                        {visit && ['waiting', 'checked-in'].includes(visit.flowStatus) && <button className="btn btn-outline btn-xs" onClick={() => markNoShow(visit.visitID)}>❌ No Show</button>}
                      </div>
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
