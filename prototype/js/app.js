/**
 * App Router & Initialization — Hash-based SPA routing.
 * Routes: #/patient, #/doctor, #/reception, and placeholder views.
 */
import { store } from './store.js';
import { eventBus } from './eventBus.js';
import { showToast, closeModal } from './utils.js';
import { renderPatientView, destroyPatientView } from './patient/patientView.js';
import { renderDoctorView, destroyDoctorView } from './doctor/doctorView.js';
import { renderReceptionView, destroyReceptionView } from './reception/receptionView.js';

let currentView = null;

const PLACEHOLDER_INFO = {
  '/availability': { title: 'Doctor Availability Management', icon: '📅', desc: 'Allows doctors to define and edit their working hours, breaks, and unavailable periods.' },
  '/reports':      { title: 'Administrative Reporting',       icon: '📊', desc: 'Generates reports on appointment volumes, average waiting times, no-show rates, and clinic workload.' },
  '/notifications':{ title: 'Notifications & Alerts',         icon: '🔔', desc: 'Notifies patients of appointment confirmations, delays, or cancellations. Alerts clinic staff of scheduling conflicts.' },
  '/audit':        { title: 'Audit Log',                      icon: '📝', desc: 'Maintains comprehensive audit logs of all significant system activities for traceability and compliance.' },
  '/settings':     { title: 'System Settings & RBAC',         icon: '⚙️', desc: 'Enforces role-based access control and manages system configuration, user accounts, and data privacy.' },
};

function destroyCurrent() {
  if (currentView === 'patient')   destroyPatientView();
  if (currentView === 'doctor')    destroyDoctorView();
  if (currentView === 'reception') destroyReceptionView();
  currentView = null;
}

function renderPlaceholder(path) {
  const info = PLACEHOLDER_INFO[path] || { title: 'Unknown', icon: '❓', desc: '' };
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="placeholder-view">
      <div class="placeholder-card">
        <div class="placeholder-icon">${info.icon}</div>
        <h2>${info.title}</h2>
        <p>${info.desc}</p>
        <div class="placeholder-badge">
          <span class="construction-icon">🚧</span>
          <span>This function has not been implemented yet.</span>
        </div>
        <p class="placeholder-note">This feature is planned for a future release of the Smart Clinic system.</p>
      </div>
    </div>
  `;
}

function navigate() {
  const hash = window.location.hash || '#/patient';
  const path = hash.replace('#', '');

  destroyCurrent();

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[href="${hash}"]`);
  if (activeNav) activeNav.classList.add('active');

  const container = document.getElementById('view-container');
  container.innerHTML = '';
  container.className = 'view-enter';
  requestAnimationFrame(() => container.className = '');

  switch (path) {
    case '/patient':
      currentView = 'patient';
      renderPatientView(container);
      break;
    case '/doctor':
      currentView = 'doctor';
      renderDoctorView(container);
      break;
    case '/reception':
      currentView = 'reception';
      renderReceptionView(container);
      break;
    default:
      currentView = 'placeholder';
      renderPlaceholder(path);
  }
}

/* ── Clock ── */
function updateClock() {
  const el = document.getElementById('sidebar-clock');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

/* ── Init ── */
function init() {
  window.addEventListener('hashchange', navigate);

  // Reset button
  document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
    if (confirm('Reset all demo data to defaults?')) {
      store.reset();
      showToast('Demo data has been reset.', 'success');
      navigate();
    }
  });

  // Modal close on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  // Clock
  updateClock();
  setInterval(updateClock, 30000);

  // Navigate to initial route
  if (!window.location.hash) window.location.hash = '#/patient';
  else navigate();

  // Re-render on store reset
  eventBus.on('store:reset', () => navigate());
}

document.addEventListener('DOMContentLoaded', init);
