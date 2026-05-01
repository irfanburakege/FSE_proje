/**
 * MyAppointments — Displays patient's appointment list with
 * reschedule and cancel functionality.
 */
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { useModal } from '../../context/StoreContext.jsx';
import { formatDate, formatTime, getWeekdayDates } from '../../utils/utils.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function MyAppointments({ onSwitchToBook }) {
  const { store, showToast } = useStore();
  const { showModal, closeModal } = useModal();

  const patientID = store.getCurrentPatientID();
  const patient = store.getPatient(patientID);
  const appointments = store.getAppointments({ patientID }).sort((a, b) => {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1;
    return a.timeSlot > b.timeSlot ? -1 : 1;
  });

  const handleCancel = async (appointmentID) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const result = await store.cancelAppointment(appointmentID);
      if (result.error) showToast(result.error, 'error');
      else showToast('Appointment cancelled.', 'success');
    }
  };

  const handleReschedule = (apt) => {
    const doc = store.getDoctor(apt.doctorID);
    const dept = store.getDepartment(apt.departmentID);
    showModal(
      <RescheduleModal
        apt={apt}
        doc={doc}
        dept={dept}
        store={store}
        showToast={showToast}
        closeModal={closeModal}
      />
    );
  };

  if (appointments.length === 0) {
    return (
      <div className="empty-state mt-24">
        <div className="empty-icon">📭</div>
        <p>No appointments found for {patient?.name || 'this patient'}.</p>
        <button className="btn btn-primary mt-16" onClick={onSwitchToBook}>
          Book an Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="my-appointments mt-16">
      <div className="card">
        <div className="card-header">
          <h3>📋 Appointments for {patient?.name}</h3>
          <span className="text-sm text-muted">{appointments.length} total</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Date</th><th>Time</th><th>Doctor</th><th>Department</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => {
                const doc = store.getDoctor(apt.doctorID);
                const dept = store.getDepartment(apt.departmentID);
                const canModify = ['requested', 'confirmed'].includes(apt.status);
                return (
                  <tr key={apt.appointmentID}>
                    <td><code className="text-xs">{apt.appointmentID}</code></td>
                    <td>{formatDate(apt.date)}</td>
                    <td>{formatTime(apt.timeSlot)} — {formatTime(apt.endTime)}</td>
                    <td>{doc?.name || 'N/A'}</td>
                    <td>{dept?.icon || ''} {dept?.name || 'N/A'}</td>
                    <td><StatusBadge status={apt.status} type="appointment" /></td>
                    <td>
                      {canModify ? (
                        <div className="flex gap-8">
                          <button className="btn btn-outline btn-xs" onClick={() => handleReschedule(apt)}>
                            🔄 Reschedule
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleCancel(apt.appointmentID)}>
                            ✕ Cancel
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Reschedule Modal Content ── */
function RescheduleModal({ apt, doc, dept, store, showToast, closeModal }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const dates = getWeekdayDates(10);
  const slots = selectedDate ? store.getAvailableSlots(apt.doctorID, selectedDate) : [];

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDate) return;
    const result = await store.rescheduleAppointment(apt.appointmentID, selectedDate, selectedSlot.startTime, selectedSlot.endTime);
    if (result.error) showToast(result.error, 'error');
    else {
      showToast('Appointment rescheduled!', 'success');
      closeModal();
    }
  };

  return (
    <>
      <div className="modal-title">🔄 Reschedule Appointment</div>
      <p className="text-sm text-muted mb-16">{doc?.name} · {dept?.name}</p>
      <p className="text-sm text-muted mb-16">
        Current: {formatDate(apt.date)} · {formatTime(apt.timeSlot)}
      </p>

      <div className="form-group">
        <label className="form-label">New Date</label>
        <select
          className="form-select"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
        >
          <option value="">Select date...</option>
          {dates.map(d => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
        </select>
      </div>

      {selectedDate && slots.length > 0 && (
        <div className="time-grid compact">
          {slots.map(s => (
            (() => {
              const isCurrentSlot = selectedDate === apt.date && s.startTime === apt.timeSlot;
              const isDisabled = !s.isAvailable || isCurrentSlot;
              return (
                <button
                  key={s.startTime}
                  className={`time-btn ${isDisabled ? 'booked' : ''} ${selectedSlot?.startTime === s.startTime ? 'selected' : ''}`}
                  disabled={isDisabled}
                  onClick={() => setSelectedSlot(s)}
                  title={isCurrentSlot ? 'Current appointment slot' : undefined}
                >
                  {formatTime(s.startTime)}
                  {isCurrentSlot && <span className="booked-label">Current</span>}
                </button>
              );
            })()
          ))}
        </div>
      )}

      <div className="flex gap-8 mt-16">
        <button
          className="btn btn-primary"
          disabled={!selectedSlot || !selectedDate}
          onClick={handleConfirm}
        >
          Confirm Reschedule
        </button>
        <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
      </div>
    </>
  );
}
