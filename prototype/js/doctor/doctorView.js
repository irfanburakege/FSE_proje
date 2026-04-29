/**
 * Doctor View — UC-03: Doctor Session Dashboard.
 * Displays daily schedule, patient list with status controls,
 * session info with patient limits, and consultation management.
 */
import { store } from '../store.js';
import { eventBus } from '../eventBus.js';
import { getToday, formatTime, formatDate, statusBadge, showToast, waitMinutes } from '../utils.js';
import { startConsultation, moveToAssessment, completeConsultation, markNoShow, markNoShowByAppointment } from './sessionManager.js';

let unsubs = [];
let selectedDoctorID = 'DOC-01';

export function renderDoctorView(container) {
  function render() {
    const today = getToday();
    const doctor = store.getDoctor(selectedDoctorID);
    const dept = store.getDepartment(doctor?.departmentID);
    const schedule = store.getSchedule(selectedDoctorID, today);
    const appointments = store.getAppointments({ doctorID: selectedDoctorID, date: today })
      .filter(a => a.status !== 'cancelled')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    const visits = store.getVisits({ doctorID: selectedDoctorID, date: today });
    const inConsult = visits.find(v => v.flowStatus === 'in-consultation');
    const inAssess = visits.find(v => v.flowStatus === 'assessment');
    const completedCount = visits.filter(v => v.flowStatus === 'completed').length;
    const noShowCount = visits.filter(v => v.flowStatus === 'no-show').length;
    const waitingCount = visits.filter(v => ['waiting', 'checked-in'].includes(v.flowStatus)).length;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>🩺 Doctor Session Dashboard</h2>
          <p class="page-subtitle">${formatDate(today)} — Daily patient schedule and consultation management</p>
        </div>
        <div class="flex items-center gap-12">
          <label class="form-label" style="margin:0">Doctor:</label>
          <select class="form-select" id="doctor-select" style="width:220px">
            ${store.getDoctors().map(d => {
              const dp = store.getDepartment(d.departmentID);
              return `<option value="${d.doctorID}" ${d.doctorID === selectedDoctorID ? 'selected' : ''}>${d.name} — ${dp?.name || ''}</option>`;
            }).join('')}
          </select>
        </div>
      </div>

      <!-- Session Stats -->
      <div class="stats-grid">
        <div class="stat-card" style="--stat-color: var(--primary)">
          <div class="stat-value">${appointments.length}</div>
          <div class="stat-label">Total Patients</div>
        </div>
        <div class="stat-card" style="--stat-color: var(--warning)">
          <div class="stat-value">${waitingCount}</div>
          <div class="stat-label">Waiting</div>
        </div>
        <div class="stat-card" style="--stat-color: var(--danger)">
          <div class="stat-value">${inConsult ? 1 : 0}</div>
          <div class="stat-label">In Consultation</div>
        </div>
        <div class="stat-card" style="--stat-color: var(--success)">
          <div class="stat-value">${completedCount}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card" style="--stat-color: #6B7280">
          <div class="stat-value">${noShowCount}</div>
          <div class="stat-label">No Show</div>
        </div>
      </div>

      <div class="doctor-layout">
        <!-- Session Info Card -->
        <div class="card session-info-card">
          <div class="card-header">
            <h3>📋 Session Info</h3>
          </div>
          <div class="card-body">
            <div class="session-detail"><span>👨‍⚕️ Doctor</span><strong>${doctor?.name || 'N/A'}</strong></div>
            <div class="session-detail"><span>${dept?.icon || ''} Department</span><strong>${dept?.name || 'N/A'}</strong></div>
            <div class="session-detail"><span>🕐 Working Hours</span><strong>${schedule ? formatTime(schedule.workStart) + ' — ' + formatTime(schedule.workEnd) : 'N/A'}</strong></div>
            <div class="session-detail"><span>☕ Break</span><strong>${schedule ? formatTime(schedule.breakStart) + ' — ' + formatTime(schedule.breakEnd) : 'N/A'}</strong></div>
            <div class="session-detail"><span>👥 Patient Limit</span>
              <strong class="${appointments.length >= (schedule?.maxPatients || 999) ? 'text-danger' : ''}">
                ${appointments.length} / ${schedule?.maxPatients || 'N/A'}
              </strong>
            </div>
            <div class="session-detail"><span>⏱️ Slot Duration</span><strong>${dept?.slotDuration || 'N/A'} min</strong></div>
          </div>
        </div>

        <!-- Current Patient -->
        <div class="card current-patient-card">
          <div class="card-header"><h3>🔴 Current Patient</h3></div>
          <div class="card-body">
            ${inConsult ? (() => {
              const pat = store.getPatient(inConsult.patientID);
              const apt = store.getAppointment(inConsult.appointmentID);
              return `
                <div class="current-patient-info">
                  <div class="current-patient-avatar">${pat?.name?.charAt(0) || '?'}</div>
                  <div>
                    <h4>${pat?.name || 'Unknown'}</h4>
                    <p class="text-sm text-muted">Appointment: ${apt ? formatTime(apt.timeSlot) : 'N/A'}</p>
                    <p class="text-sm text-muted">Duration: ${inConsult.consultStartTime ? waitMinutes(inConsult.consultStartTime) : 'N/A'}</p>
                  </div>
                </div>
                <div class="current-patient-actions mt-16">
                  <button class="btn btn-warning btn-sm assess-btn" data-id="${inConsult.visitID}">🔬 Send to Assessment</button>
                  <button class="btn btn-success btn-sm complete-btn" data-id="${inConsult.visitID}">✅ Complete</button>
                </div>
              `;
            })() : inAssess ? (() => {
              const pat = store.getPatient(inAssess.patientID);
              return `
                <div class="current-patient-info">
                  <div class="current-patient-avatar assess">${pat?.name?.charAt(0) || '?'}</div>
                  <div>
                    <h4>${pat?.name || 'Unknown'}</h4>
                    <p class="text-sm text-muted">In Assessment</p>
                  </div>
                </div>
                <div class="current-patient-actions mt-16">
                  <button class="btn btn-success btn-sm complete-btn" data-id="${inAssess.visitID}">✅ Complete</button>
                </div>
              `;
            })() : `
              <div class="empty-state">
                <div class="empty-icon">🪑</div>
                <p>No patient in consultation</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Patient List -->
      <div class="card mt-24">
        <div class="card-header">
          <h3>📋 Today's Patients</h3>
          <span class="text-sm text-muted">${appointments.length} appointments</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Time</th><th>Patient</th><th>Status</th><th>Wait</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${appointments.length === 0 ? '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">No appointments for today</td></tr>' :
                appointments.map((apt, i) => {
                  const pat = store.getPatient(apt.patientID);
                  const visit = visits.find(v => v.appointmentID === apt.appointmentID);
                  const flowStatus = visit ? visit.flowStatus : (apt.status === 'no-show' ? 'no-show' : 'new-entry');
                  const isWaiting = visit && ['waiting', 'checked-in'].includes(visit.flowStatus);
                  const canStartConsult = isWaiting && !inConsult;
                  return `
                    <tr class="${visit?.flowStatus === 'in-consultation' ? 'row-active' : ''} ${visit?.priority === 'emergency' ? 'row-emergency' : ''}">
                      <td>${i + 1}</td>
                      <td><strong>${formatTime(apt.timeSlot)}</strong><br><span class="text-xs text-muted">${formatTime(apt.endTime)}</span></td>
                      <td>
                        <strong>${pat?.name || 'Unknown'}</strong>
                        ${visit?.priority === 'emergency' ? '<span class="priority-tag">🚨 EMERGENCY</span>' : ''}
                      </td>
                      <td>${statusBadge(flowStatus)}</td>
                      <td class="text-sm">${visit?.checkInTime ? waitMinutes(visit.checkInTime) : '—'}</td>
                      <td>
                        <div class="flex gap-8">
                          ${canStartConsult ? `<button class="btn btn-primary btn-xs start-btn" data-vid="${visit.visitID}">🩺 Start</button>` : ''}
                          ${visit?.flowStatus === 'in-consultation' ? `
                            <button class="btn btn-warning btn-xs assess-btn" data-id="${visit.visitID}">🔬 Assess</button>
                            <button class="btn btn-success btn-xs complete-btn" data-id="${visit.visitID}">✅ Done</button>
                          ` : ''}
                          ${visit?.flowStatus === 'assessment' ? `<button class="btn btn-success btn-xs complete-btn" data-id="${visit.visitID}">✅ Done</button>` : ''}
                          ${(flowStatus === 'new-entry' && apt.status === 'scheduled') ? `<button class="btn btn-outline btn-xs noshow-apt-btn" data-aid="${apt.appointmentID}">❌ No Show</button>` : ''}
                          ${visit && ['waiting','checked-in'].includes(visit.flowStatus) ? `<button class="btn btn-outline btn-xs noshow-btn" data-vid="${visit.visitID}">❌ No Show</button>` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event handlers
    container.querySelector('#doctor-select').addEventListener('change', (e) => {
      selectedDoctorID = e.target.value; render();
    });
    container.querySelectorAll('.start-btn').forEach(b => b.addEventListener('click', () => { startConsultation(b.dataset.vid); render(); }));
    container.querySelectorAll('.assess-btn').forEach(b => b.addEventListener('click', () => { moveToAssessment(b.dataset.id); render(); }));
    container.querySelectorAll('.complete-btn').forEach(b => b.addEventListener('click', () => { completeConsultation(b.dataset.id); render(); }));
    container.querySelectorAll('.noshow-btn').forEach(b => b.addEventListener('click', () => { markNoShow(b.dataset.vid); render(); }));
    container.querySelectorAll('.noshow-apt-btn').forEach(b => b.addEventListener('click', () => { markNoShowByAppointment(b.dataset.aid); render(); }));
  }

  render();
  const u1 = eventBus.on('appointment:created', render);
  const u2 = eventBus.on('appointment:cancelled', render);
  const u3 = eventBus.on('patient:checkedIn', render);
  const u4 = eventBus.on('patient:statusChanged', render);
  const u5 = eventBus.on('queue:updated', render);
  const u6 = eventBus.on('appointment:updated', render);
  unsubs = [u1, u2, u3, u4, u5, u6];
}

export function destroyDoctorView() {
  unsubs.forEach(u => u && u());
  unsubs = [];
}
