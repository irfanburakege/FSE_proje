/**
 * Patient View — UC-01: Patient Books an Appointment.
 * Contains: Patient selector, booking wizard, and "My Appointments" list.
 */
import { store } from '../store.js';
import { eventBus } from '../eventBus.js';
import { formatDate, formatTime, showToast, statusBadge, APPOINTMENT_STATUSES, showModal, closeModal, getToday } from '../utils.js';
import { renderAppointmentForm } from './appointmentForm.js';

let unsubs = [];

export function renderPatientView(container) {
  let tab = 'book'; // 'book' or 'my'

  function render() {
    const patient = store.getPatient(store.getCurrentPatientID());
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>📋 Patient Portal</h2>
          <p class="page-subtitle">Book, reschedule, or cancel your appointments</p>
        </div>
        <div class="flex items-center gap-12">
          <label class="form-label" style="margin:0;white-space:nowrap">Patient:</label>
          <select class="form-select" id="patient-select" style="width:200px">
            ${store.getPatients().map(p => `
              <option value="${p.patientID}" ${p.patientID === store.getCurrentPatientID() ? 'selected' : ''}>${p.name}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="patient-tabs">
        <button class="tab-btn ${tab === 'book' ? 'active' : ''}" data-tab="book">📝 Book Appointment</button>
        <button class="tab-btn ${tab === 'my' ? 'active' : ''}" data-tab="my">📋 My Appointments</button>
      </div>

      <div id="patient-tab-content"></div>
    `;

    // Patient selector
    container.querySelector('#patient-select').addEventListener('change', (e) => {
      store.setCurrentPatient(e.target.value);
      render();
    });

    // Tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; render(); });
    });

    // Render tab content
    const tabContent = container.querySelector('#patient-tab-content');
    if (tab === 'book') {
      renderAppointmentForm(tabContent, () => { tab = 'my'; render(); });
    } else {
      renderMyAppointments(tabContent);
    }
  }

  function renderMyAppointments(el) {
    const patientID = store.getCurrentPatientID();
    const patient = store.getPatient(patientID);
    const appointments = store.getAppointments({ patientID }).sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return a.timeSlot > b.timeSlot ? -1 : 1;
    });

    if (appointments.length === 0) {
      el.innerHTML = `
        <div class="empty-state mt-24">
          <div class="empty-icon">📭</div>
          <p>No appointments found for ${patient?.name || 'this patient'}.</p>
          <button class="btn btn-primary mt-16" id="book-now-btn">Book an Appointment</button>
        </div>
      `;
      el.querySelector('#book-now-btn')?.addEventListener('click', () => {
        const tabBtns = container.querySelectorAll('.tab-btn');
        tabBtns[0]?.click();
      });
      return;
    }

    el.innerHTML = `
      <div class="my-appointments mt-16">
        <div class="card">
          <div class="card-header">
            <h3>📋 Appointments for ${patient?.name}</h3>
            <span class="text-sm text-muted">${appointments.length} total</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Date</th><th>Time</th><th>Doctor</th><th>Department</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${appointments.map(apt => {
                  const doc = store.getDoctor(apt.doctorID);
                  const dept = store.getDepartment(apt.departmentID);
                  const canModify = apt.status === 'scheduled';
                  return `
                    <tr>
                      <td><code class="text-xs">${apt.appointmentID}</code></td>
                      <td>${formatDate(apt.date)}</td>
                      <td>${formatTime(apt.timeSlot)} — ${formatTime(apt.endTime)}</td>
                      <td>${doc?.name || 'N/A'}</td>
                      <td>${dept?.icon || ''} ${dept?.name || 'N/A'}</td>
                      <td>${statusBadge(apt.status, APPOINTMENT_STATUSES)}</td>
                      <td>
                        ${canModify ? `
                          <div class="flex gap-8">
                            <button class="btn btn-outline btn-xs reschedule-btn" data-id="${apt.appointmentID}">🔄 Reschedule</button>
                            <button class="btn btn-danger btn-xs cancel-btn" data-id="${apt.appointmentID}">✕ Cancel</button>
                          </div>
                        ` : '—'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Cancel handlers
    el.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel this appointment?')) {
          const result = store.cancelAppointment(btn.dataset.id);
          if (result.error) showToast(result.error, 'error');
          else { showToast('Appointment cancelled.', 'success'); renderMyAppointments(el); }
        }
      });
    });

    // Reschedule handlers
    el.querySelectorAll('.reschedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const apt = store.getAppointment(btn.dataset.id);
        if (!apt) return;
        const doc = store.getDoctor(apt.doctorID);
        const dept = store.getDepartment(apt.departmentID);

        showModal(`
          <div class="modal-title">🔄 Reschedule Appointment</div>
          <p class="text-sm text-muted mb-16">${doc?.name} · ${dept?.name}</p>
          <div class="form-group">
            <label class="form-label">New Date</label>
            <select class="form-select" id="reschedule-date">
              <option value="">Select date...</option>
              ${import('../utils.js').then ? '' : ''}
            </select>
          </div>
          <div id="reschedule-slots"></div>
          <div class="flex gap-8 mt-16">
            <button class="btn btn-primary" id="reschedule-confirm" disabled>Confirm Reschedule</button>
            <button class="btn btn-outline" id="reschedule-cancel">Cancel</button>
          </div>
        `);

        // Populate dates dynamically
        const dateSelect = document.querySelector('#reschedule-date');
        const { getWeekdayDates: gwd } = { getWeekdayDates: () => {
          const dates = []; const today = new Date(); let i = 0;
          while (dates.length < 10) { const d = new Date(today); d.setDate(d.getDate() + i);
            if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split('T')[0]); i++; }
          return dates;
        }};
        gwd().forEach(d => {
          const opt = document.createElement('option');
          opt.value = d; opt.textContent = formatDate(d);
          dateSelect.appendChild(opt);
        });

        let newSlot = null;
        dateSelect.addEventListener('change', () => {
          const slotsEl = document.querySelector('#reschedule-slots');
          const slots = store.getAvailableSlots(apt.doctorID, dateSelect.value);
          slotsEl.innerHTML = `<div class="time-grid compact">${slots.map(s => `
            <button class="time-btn ${!s.isAvailable ? 'booked' : ''}" data-start="${s.startTime}" data-end="${s.endTime}" ${!s.isAvailable ? 'disabled' : ''}>
              ${formatTime(s.startTime)}
            </button>
          `).join('')}</div>`;
          slotsEl.querySelectorAll('.time-btn:not([disabled])').forEach(b => {
            b.addEventListener('click', () => {
              slotsEl.querySelectorAll('.time-btn').forEach(x => x.classList.remove('selected'));
              b.classList.add('selected');
              newSlot = { startTime: b.dataset.start, endTime: b.dataset.end };
              document.querySelector('#reschedule-confirm').disabled = false;
            });
          });
        });

        document.querySelector('#reschedule-confirm')?.addEventListener('click', () => {
          if (!newSlot || !dateSelect.value) return;
          const result = store.rescheduleAppointment(apt.appointmentID, dateSelect.value, newSlot.startTime, newSlot.endTime);
          if (result.error) showToast(result.error, 'error');
          else { showToast('Appointment rescheduled!', 'success'); closeModal(); renderMyAppointments(el); }
        });

        document.querySelector('#reschedule-cancel')?.addEventListener('click', closeModal);
      });
    });
  }

  render();

  // Subscribe to updates
  const unsub1 = eventBus.on('appointment:created', () => render());
  const unsub2 = eventBus.on('appointment:updated', () => render());
  const unsub3 = eventBus.on('appointment:cancelled', () => render());
  unsubs = [unsub1, unsub2, unsub3];
}

export function destroyPatientView() {
  unsubs.forEach(u => u && u());
  unsubs = [];
}
