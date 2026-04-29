/**
 * Appointment Form — Multi-step booking wizard logic.
 * Step 1: Department → Step 2: Doctor → Step 3: Date/Time → Step 4: Confirm
 */
import { store } from '../store.js';
import { formatDate, formatTime, getWeekdayDates, showToast, statusBadge, FLOW_STATUSES } from '../utils.js';

export function renderAppointmentForm(container, onComplete) {
  let step = 1;
  let selectedDept = null;
  let selectedDoctor = null;
  let selectedDate = null;
  let selectedSlot = null;

  function render() {
    container.innerHTML = `
      <div class="booking-wizard">
        <div class="wizard-steps">
          ${[
            { n: 1, label: 'Department' },
            { n: 2, label: 'Doctor' },
            { n: 3, label: 'Date & Time' },
            { n: 4, label: 'Confirm' },
          ].map(s => `
            <div class="wizard-step ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}">
              <div class="step-circle">${step > s.n ? '✓' : s.n}</div>
              <span class="step-label">${s.label}</span>
            </div>
          `).join('<div class="step-connector"></div>')}
        </div>
        <div class="wizard-content" id="wizard-content"></div>
      </div>
    `;
    renderStep();
  }

  function renderStep() {
    const content = container.querySelector('#wizard-content');
    switch (step) {
      case 1: renderDeptStep(content); break;
      case 2: renderDoctorStep(content); break;
      case 3: renderDateTimeStep(content); break;
      case 4: renderConfirmStep(content); break;
    }
  }

  function renderDeptStep(el) {
    const depts = store.getDepartments();
    el.innerHTML = `
      <h3 class="wizard-title">Select a Department</h3>
      <p class="wizard-desc">Choose the medical department for your appointment.</p>
      <div class="dept-grid">
        ${depts.map(d => `
          <div class="dept-card ${selectedDept?.deptID === d.deptID ? 'selected' : ''}"
               data-dept="${d.deptID}" style="--dept-color: ${d.color}">
            <span class="dept-icon">${d.icon}</span>
            <h4>${d.name}</h4>
            <span class="dept-slot-info">${d.slotDuration} min slots</span>
            <span class="dept-doctors">${store.getDoctorsByDept(d.deptID).length} doctors</span>
          </div>
        `).join('')}
      </div>
    `;
    el.querySelectorAll('.dept-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedDept = store.getDepartment(card.dataset.dept);
        selectedDoctor = null; selectedDate = null; selectedSlot = null;
        step = 2; render();
      });
    });
  }

  function renderDoctorStep(el) {
    const doctors = store.getDoctorsByDept(selectedDept.deptID);
    el.innerHTML = `
      <div class="wizard-nav">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back</button>
        <h3 class="wizard-title">${selectedDept.icon} ${selectedDept.name} — Select Doctor</h3>
      </div>
      <p class="wizard-desc">Choose your preferred doctor.</p>
      <div class="doctor-grid">
        ${doctors.map(d => {
          const todaySlots = store.getAvailableSlots(d.doctorID, null);
          const available = todaySlots.filter(s => s.isAvailable).length;
          return `
            <div class="doctor-card ${selectedDoctor?.doctorID === d.doctorID ? 'selected' : ''}"
                 data-doc="${d.doctorID}">
              <div class="doctor-avatar" style="--dept-color: ${selectedDept.color}">
                ${d.name.split(' ').slice(1).map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div class="doctor-info">
                <h4>${d.name}</h4>
                <p class="text-muted text-sm">${d.specialization}</p>
                <span class="slots-available">${available} slots available today</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    el.querySelector('#back-btn').addEventListener('click', () => { step = 1; render(); });
    el.querySelectorAll('.doctor-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedDoctor = store.getDoctor(card.dataset.doc);
        selectedDate = null; selectedSlot = null;
        step = 3; render();
      });
    });
  }

  function renderDateTimeStep(el) {
    const dates = getWeekdayDates(10);
    const slots = selectedDate ? store.getAvailableSlots(selectedDoctor.doctorID, selectedDate) : [];

    el.innerHTML = `
      <div class="wizard-nav">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back</button>
        <h3 class="wizard-title">Select Date & Time</h3>
      </div>
      <p class="wizard-desc">${selectedDoctor.name} · ${selectedDept.name} · ${selectedDept.slotDuration} min appointments</p>
      <div class="datetime-layout">
        <div class="date-section">
          <h4>📅 Pick a Date</h4>
          <div class="date-grid">
            ${dates.map(d => `
              <button class="date-btn ${selectedDate === d ? 'selected' : ''}" data-date="${d}">
                <span class="date-weekday">${new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span class="date-day">${new Date(d + 'T00:00:00').getDate()}</span>
                <span class="date-month">${new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="time-section">
          <h4>🕐 Pick a Time</h4>
          ${!selectedDate ? '<p class="text-muted text-sm">Select a date first</p>' :
            slots.length === 0 ? '<p class="text-muted text-sm">No slots available for this date</p>' : `
            <div class="time-grid">
              ${slots.map(s => `
                <button class="time-btn ${!s.isAvailable ? 'booked' : ''} ${selectedSlot?.startTime === s.startTime ? 'selected' : ''}"
                        data-start="${s.startTime}" data-end="${s.endTime}" ${!s.isAvailable ? 'disabled' : ''}>
                  ${formatTime(s.startTime)}
                  ${!s.isAvailable ? '<span class="booked-label">Booked</span>' : ''}
                </button>
              `).join('')}
            </div>
          `}
        </div>
      </div>
      ${selectedSlot ? '<div class="wizard-footer"><button class="btn btn-primary" id="next-btn">Continue →</button></div>' : ''}
    `;

    el.querySelector('#back-btn').addEventListener('click', () => { step = 2; render(); });
    el.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDate = btn.dataset.date;
        selectedSlot = null;
        renderStep();
      });
    });
    el.querySelectorAll('.time-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSlot = { startTime: btn.dataset.start, endTime: btn.dataset.end };
        renderStep();
      });
    });
    el.querySelector('#next-btn')?.addEventListener('click', () => { step = 4; render(); });
  }

  function renderConfirmStep(el) {
    const patient = store.getPatient(store.getCurrentPatientID());
    el.innerHTML = `
      <div class="wizard-nav">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back</button>
        <h3 class="wizard-title">Confirm Appointment</h3>
      </div>
      <div class="confirm-card">
        <div class="confirm-row"><span class="confirm-label">Patient</span><span>${patient?.name || 'N/A'}</span></div>
        <div class="confirm-row"><span class="confirm-label">Department</span><span>${selectedDept.icon} ${selectedDept.name}</span></div>
        <div class="confirm-row"><span class="confirm-label">Doctor</span><span>${selectedDoctor.name}</span></div>
        <div class="confirm-row"><span class="confirm-label">Date</span><span>${formatDate(selectedDate)}</span></div>
        <div class="confirm-row"><span class="confirm-label">Time</span><span>${formatTime(selectedSlot.startTime)} — ${formatTime(selectedSlot.endTime)}</span></div>
        <div class="confirm-row"><span class="confirm-label">Duration</span><span>${selectedDept.slotDuration} minutes</span></div>
      </div>
      <div class="wizard-footer">
        <button class="btn btn-primary btn-lg" id="confirm-btn">✅ Confirm Booking</button>
      </div>
    `;
    el.querySelector('#back-btn').addEventListener('click', () => { step = 3; render(); });
    el.querySelector('#confirm-btn').addEventListener('click', () => {
      const result = store.createAppointment({
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
    });
  }

  render();
}
