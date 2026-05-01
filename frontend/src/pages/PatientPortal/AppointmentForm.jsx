/**
 * AppointmentForm — Multi-step booking wizard.
 * Step 1: Department → Step 2: Doctor → Step 3: Date/Time → Step 4: Confirm
 */
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { formatDate, formatTime, getWeekdayDates } from '../../utils/utils.js';

const WIZARD_STEPS = [
  { n: 1, label: 'Department' },
  { n: 2, label: 'Doctor' },
  { n: 3, label: 'Date & Time' },
  { n: 4, label: 'Confirm' },
];

export default function AppointmentForm({ onComplete }) {
  const { store, showToast } = useStore();
  const [step, setStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    const result = await store.createAppointment({
      patientID: store.getCurrentPatientID(),
      doctorID: selectedDoctor.doctorID,
      departmentID: selectedDept.deptID,
      date: selectedDate,
      timeSlot: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });
    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(`Appointment booked! ID: ${result.appointment.appointmentID}`, 'success');
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="booking-wizard">
      {/* Wizard Steps Indicator */}
      <div className="wizard-steps">
        {WIZARD_STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className="step-connector" />}
            <div className={`wizard-step ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`}>
              <div className="step-circle">{step > s.n ? '✓' : s.n}</div>
              <span className="step-label">{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Wizard Content */}
      <div className="wizard-content" id="wizard-content">
        {step === 1 && <DeptStep store={store} selectedDept={selectedDept} onSelect={handleDeptSelect} />}
        {step === 2 && <DoctorStep store={store} dept={selectedDept} selectedDoctor={selectedDoctor} onSelect={handleDoctorSelect} onBack={() => setStep(1)} />}
        {step === 3 && <DateTimeStep store={store} dept={selectedDept} doctor={selectedDoctor} selectedDate={selectedDate} selectedSlot={selectedSlot} onDateSelect={handleDateSelect} onSlotSelect={handleSlotSelect} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <ConfirmStep store={store} dept={selectedDept} doctor={selectedDoctor} date={selectedDate} slot={selectedSlot} onConfirm={handleConfirm} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}

/* ── Step 1: Department ── */
function DeptStep({ store, selectedDept, onSelect }) {
  const depts = store.getDepartments();
  return (
    <>
      <h3 className="wizard-title">Select a Department</h3>
      <p className="wizard-desc">Choose the medical department for your appointment.</p>
      <div className="dept-grid">
        {depts.map(d => (
          <div
            key={d.deptID}
            className={`dept-card ${selectedDept?.deptID === d.deptID ? 'selected' : ''}`}
            style={{ '--dept-color': d.color }}
            onClick={() => onSelect(d)}
          >
            <span className="dept-icon">{d.icon}</span>
            <h4>{d.name}</h4>
            <span className="dept-slot-info">{d.slotDuration} min slots</span>
            <span className="dept-doctors">{store.getDoctorsByDept(d.deptID).length} doctors</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Step 2: Doctor ── */
function DoctorStep({ store, dept, selectedDoctor, onSelect, onBack }) {
  const doctors = store.getDoctorsByDept(dept.deptID);
  return (
    <>
      <div className="wizard-nav">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h3 className="wizard-title">{dept.icon} {dept.name} — Select Doctor</h3>
      </div>
      <p className="wizard-desc">Choose your preferred doctor.</p>
      <div className="doctor-grid">
        {doctors.map(d => {
          const todaySlots = store.getAvailableSlots(d.doctorID, null);
          const available = todaySlots.filter(s => s.isAvailable).length;
          const initials = d.name.split(' ').slice(1).map(n => n[0]).join('').substring(0, 2);
          return (
            <div
              key={d.doctorID}
              className={`doctor-card ${selectedDoctor?.doctorID === d.doctorID ? 'selected' : ''}`}
              onClick={() => onSelect(d)}
            >
              <div className="doctor-avatar" style={{ '--dept-color': dept.color }}>{initials}</div>
              <div className="doctor-info">
                <h4>{d.name}</h4>
                <p className="text-muted text-sm">{d.specialization}</p>
                <span className="slots-available">{available} slots available today</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 3: Date & Time ── */
function DateTimeStep({ store, dept, doctor, selectedDate, selectedSlot, onDateSelect, onSlotSelect, onNext, onBack }) {
  const dates = getWeekdayDates(10);
  const slots = selectedDate ? store.getAvailableSlots(doctor.doctorID, selectedDate) : [];

  return (
    <>
      <div className="wizard-nav">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h3 className="wizard-title">Select Date & Time</h3>
      </div>
      <p className="wizard-desc">{doctor.name} · {dept.name} · {dept.slotDuration} min appointments</p>

      <div className="datetime-layout">
        <div className="date-section">
          <h4>📅 Pick a Date</h4>
          <div className="date-grid">
            {dates.map(d => {
              const dateObj = new Date(d + 'T00:00:00');
              return (
                <button
                  key={d}
                  className={`date-btn ${selectedDate === d ? 'selected' : ''}`}
                  onClick={() => onDateSelect(d)}
                >
                  <span className="date-weekday">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="date-day">{dateObj.getDate()}</span>
                  <span className="date-month">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="time-section">
          <h4>🕐 Pick a Time</h4>
          {!selectedDate ? (
            <p className="text-muted text-sm">Select a date first</p>
          ) : slots.length === 0 ? (
            <p className="text-muted text-sm">No slots available for this date</p>
          ) : (
            <div className="time-grid">
              {slots.map(s => (
                <button
                  key={s.startTime}
                  className={`time-btn ${!s.isAvailable ? 'booked' : ''} ${selectedSlot?.startTime === s.startTime ? 'selected' : ''}`}
                  disabled={!s.isAvailable}
                  onClick={() => onSlotSelect(s)}
                >
                  {formatTime(s.startTime)}
                  {!s.isAvailable && <span className="booked-label">Booked</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="wizard-footer">
          <button className="btn btn-primary" onClick={onNext}>Continue →</button>
        </div>
      )}
    </>
  );
}

/* ── Step 4: Confirm ── */
function ConfirmStep({ store, dept, doctor, date, slot, onConfirm, onBack }) {
  const patient = store.getPatient(store.getCurrentPatientID());
  return (
    <>
      <div className="wizard-nav">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h3 className="wizard-title">Confirm Appointment</h3>
      </div>
      <div className="confirm-card">
        <div className="confirm-row"><span className="confirm-label">Patient</span><span>{patient?.name || 'N/A'}</span></div>
        <div className="confirm-row"><span className="confirm-label">Department</span><span>{dept.icon} {dept.name}</span></div>
        <div className="confirm-row"><span className="confirm-label">Doctor</span><span>{doctor.name}</span></div>
        <div className="confirm-row"><span className="confirm-label">Date</span><span>{formatDate(date)}</span></div>
        <div className="confirm-row"><span className="confirm-label">Time</span><span>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</span></div>
        <div className="confirm-row"><span className="confirm-label">Duration</span><span>{dept.slotDuration} minutes</span></div>
      </div>
      <div className="wizard-footer">
        <button className="btn btn-primary btn-lg" onClick={onConfirm}>✅ Confirm Booking</button>
      </div>
    </>
  );
}
