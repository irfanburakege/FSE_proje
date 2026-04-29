/**
 * Reception View — UC-02: Reception Desk Dashboard.
 * Real-time overview: stats, patient queue, doctor status board,
 * check-in, priority management, and manual appointment creation.
 */
import { store } from '../store.js';
import { eventBus } from '../eventBus.js';
import { getToday, formatTime, formatDate, statusBadge, showToast, waitMinutes, showModal, closeModal, FLOW_STATUSES, getWeekdayDates } from '../utils.js';
import { checkInPatient, setEmergencyPriority, setNormalPriority } from './queueManager.js';

let unsubs = [];

export function renderReceptionView(container) {
  function render() {
    const today = getToday();
    const stats = store.getDayStats(today);
    const allAppointments = store.getAppointments({ date: today }).filter(a => a.status !== 'cancelled')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    const allVisits = store.getVisits({ date: today });
    const allQueues = store.getAllQueues(today);
    const doctors = store.getDoctors();

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>🖥️ Reception Desk Dashboard</h2>
          <p class="page-subtitle">${formatDate(today)} — Real-time patient flow and queue monitoring</p>
        </div>
        <button class="btn btn-primary" id="manual-apt-btn">➕ Manual Appointment</button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card" style="--stat-color: var(--primary)"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Appointments</div></div>
        <div class="stat-card" style="--stat-color: var(--warning)"><div class="stat-value">${stats.waiting}</div><div class="stat-label">Waiting</div></div>
        <div class="stat-card" style="--stat-color: var(--danger)"><div class="stat-value">${stats.inConsultation}</div><div class="stat-label">In Consultation</div></div>
        <div class="stat-card" style="--stat-color: var(--purple)"><div class="stat-value">${stats.assessment}</div><div class="stat-label">Assessment</div></div>
        <div class="stat-card" style="--stat-color: var(--success)"><div class="stat-value">${stats.completed}</div><div class="stat-label">Completed</div></div>
        <div class="stat-card" style="--stat-color: #6B7280"><div class="stat-value">${stats.noShow}</div><div class="stat-label">No Show</div></div>
      </div>

      <div class="reception-layout">
        <!-- Doctor Status Board -->
        <div class="card">
          <div class="card-header"><h3>👨‍⚕️ Doctor Status Board</h3></div>
          <div class="card-body doctor-status-grid">
            ${doctors.map(doc => {
              const dept = store.getDepartment(doc.departmentID);
              const docVisits = allVisits.filter(v => v.doctorID === doc.doctorID);
              const inConsult = docVisits.find(v => v.flowStatus === 'in-consultation');
              const waiting = docVisits.filter(v => ['waiting','checked-in'].includes(v.flowStatus)).length;
              const completed = docVisits.filter(v => v.flowStatus === 'completed').length;
              const statusClass = inConsult ? 'busy' : waiting > 0 ? 'has-waiting' : 'free';
              const currentPat = inConsult ? store.getPatient(inConsult.patientID) : null;
              return `
                <div class="doctor-status-card ${statusClass}">
                  <div class="ds-header">
                    <div class="ds-indicator"></div>
                    <strong>${doc.name}</strong>
                  </div>
                  <div class="ds-dept">${dept?.icon || ''} ${dept?.name || ''}</div>
                  <div class="ds-details">
                    ${inConsult ? `<span class="ds-current">🩺 ${currentPat?.name || 'Patient'}</span>` : '<span class="ds-current free-text">Available</span>'}
                    <span class="text-xs text-muted">⏳ ${waiting} waiting · ✅ ${completed} done</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Patient Queue -->
        <div class="card">
          <div class="card-header"><h3>📋 Patient Queue</h3><span class="text-sm text-muted">${allQueues.length} in queue</span></div>
          <div class="card-body queue-body">
            ${allQueues.length === 0 ? '<div class="empty-state"><div class="empty-icon">✨</div><p>Queue is empty — no patients currently waiting.</p></div>' :
              `<div class="queue-list">
                ${allQueues.map((visit, i) => {
                  const pat = store.getPatient(visit.patientID);
                  const doc = store.getDoctor(visit.doctorID);
                  const dept = store.getDepartment(doc?.departmentID);
                  const isEmergency = visit.priority === 'emergency';
                  return `
                    <div class="queue-item ${isEmergency ? 'priority-emergency' : ''}">
                      <div class="qi-position">${i + 1}</div>
                      <div class="qi-info">
                        <strong>${pat?.name || 'Unknown'}</strong>
                        <span class="text-xs text-muted">${doc?.name || ''} · ${dept?.name || ''}</span>
                      </div>
                      <div class="qi-meta">
                        ${statusBadge(visit.flowStatus)}
                        <span class="text-xs text-muted">⏱ ${waitMinutes(visit.checkInTime)}</span>
                      </div>
                      <div class="qi-actions">
                        ${isEmergency ?
                          `<button class="btn btn-outline btn-xs normal-btn" data-vid="${visit.visitID}" title="Remove emergency priority">🔽 Normal</button>` :
                          `<button class="btn btn-danger btn-xs emerg-btn" data-vid="${visit.visitID}" title="Flag as emergency">🚨 Emergency</button>`
                        }
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>`
            }
          </div>
        </div>
      </div>

      <!-- All Appointments Table -->
      <div class="card mt-24">
        <div class="card-header"><h3>📅 All Today's Appointments</h3><span class="text-sm text-muted">${allAppointments.length} appointments</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${allAppointments.map(apt => {
                const pat = store.getPatient(apt.patientID);
                const doc = store.getDoctor(apt.doctorID);
                const dept = store.getDepartment(apt.departmentID);
                const visit = allVisits.find(v => v.appointmentID === apt.appointmentID);
                const flowStatus = visit ? visit.flowStatus : (apt.status === 'no-show' ? 'no-show' : 'new-entry');
                const canCheckIn = !visit && apt.status === 'scheduled';
                return `
                  <tr>
                    <td><strong>${formatTime(apt.timeSlot)}</strong></td>
                    <td>${pat?.name || 'Unknown'}</td>
                    <td>${doc?.name || 'N/A'}</td>
                    <td>${dept?.icon || ''} ${dept?.name || ''}</td>
                    <td>${statusBadge(flowStatus)}</td>
                    <td>
                      ${canCheckIn ? `<button class="btn btn-success btn-xs checkin-btn" data-aid="${apt.appointmentID}">✅ Check In</button>` : '—'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event handlers
    container.querySelectorAll('.checkin-btn').forEach(b => b.addEventListener('click', () => { checkInPatient(b.dataset.aid); }));
    container.querySelectorAll('.emerg-btn').forEach(b => b.addEventListener('click', () => { setEmergencyPriority(b.dataset.vid); }));
    container.querySelectorAll('.normal-btn').forEach(b => b.addEventListener('click', () => { setNormalPriority(b.dataset.vid); }));

    // Manual appointment button
    container.querySelector('#manual-apt-btn')?.addEventListener('click', () => {
      showManualAppointmentModal();
    });
  }

  function showManualAppointmentModal() {
    const depts = store.getDepartments();
    const patients = store.getPatients();
    showModal(`
      <div class="modal-title">➕ Create Manual Appointment</div>
      <div class="form-group">
        <label class="form-label">Patient</label>
        <select class="form-select" id="m-patient">${patients.map(p => `<option value="${p.patientID}">${p.name}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Department</label>
        <select class="form-select" id="m-dept"><option value="">Select...</option>${depts.map(d => `<option value="${d.deptID}">${d.icon} ${d.name}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Doctor</label>
        <select class="form-select" id="m-doctor"><option value="">Select department first</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <select class="form-select" id="m-date">${getWeekdayDates(10).map(d => `<option value="${d}">${formatDate(d)}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Time Slot</label>
        <select class="form-select" id="m-slot"><option value="">Select doctor & date first</option></select>
      </div>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-primary" id="m-create">Create Appointment</button>
        <button class="btn btn-outline" id="m-cancel">Cancel</button>
      </div>
    `);

    const deptSelect = document.querySelector('#m-dept');
    const docSelect = document.querySelector('#m-doctor');
    const dateSelect = document.querySelector('#m-date');
    const slotSelect = document.querySelector('#m-slot');

    function updateDoctors() {
      const deptID = deptSelect.value;
      const docs = deptID ? store.getDoctorsByDept(deptID) : [];
      docSelect.innerHTML = docs.length === 0 ? '<option value="">No doctors</option>' :
        docs.map(d => `<option value="${d.doctorID}">${d.name}</option>`).join('');
      updateSlots();
    }

    function updateSlots() {
      const docID = docSelect.value;
      const date = dateSelect.value;
      if (!docID || !date) { slotSelect.innerHTML = '<option value="">Select doctor & date</option>'; return; }
      const slots = store.getAvailableSlots(docID, date).filter(s => s.isAvailable);
      slotSelect.innerHTML = slots.length === 0 ? '<option value="">No slots available</option>' :
        slots.map(s => `<option value="${s.startTime}|${s.endTime}">${formatTime(s.startTime)} — ${formatTime(s.endTime)}</option>`).join('');
    }

    deptSelect.addEventListener('change', updateDoctors);
    docSelect.addEventListener('change', updateSlots);
    dateSelect.addEventListener('change', updateSlots);

    document.querySelector('#m-create')?.addEventListener('click', () => {
      const slotVal = slotSelect.value;
      if (!slotVal || !docSelect.value) { showToast('Please fill all fields.', 'warning'); return; }
      const [timeSlot, endTime] = slotVal.split('|');
      const result = store.createAppointment({
        patientID: document.querySelector('#m-patient').value,
        doctorID: docSelect.value,
        departmentID: deptSelect.value,
        date: dateSelect.value,
        timeSlot, endTime,
      });
      if (result.error) showToast(result.error, 'error');
      else { showToast('Appointment created!', 'success'); closeModal(); }
    });

    document.querySelector('#m-cancel')?.addEventListener('click', closeModal);
  }

  render();
  const u1 = eventBus.on('appointment:created', render);
  const u2 = eventBus.on('appointment:cancelled', render);
  const u3 = eventBus.on('appointment:updated', render);
  const u4 = eventBus.on('patient:checkedIn', render);
  const u5 = eventBus.on('patient:statusChanged', render);
  const u6 = eventBus.on('queue:updated', render);
  unsubs = [u1, u2, u3, u4, u5, u6];
}

export function destroyReceptionView() {
  unsubs.forEach(u => u && u());
  unsubs = [];
}
