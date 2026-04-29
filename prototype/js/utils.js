/**
 * Shared utility functions: date/time formatting, ID generation,
 * status configuration, toast notifications, and modal management.
 */

let toastCounter = 0;

/* ── ID Generation ── */
export function generateID(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/* ── Date / Time Helpers ── */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getWeekdayDates(days = 14) {
  const dates = [];
  const today = new Date();
  let i = 0;
  while (dates.length < days) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d.toISOString().split('T')[0]);
    }
    i++;
  }
  return dates;
}

export function generateTimeSlots(workStart, workEnd, breakStart, breakEnd, slotDuration) {
  const slots = [];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toStr = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  let current = toMin(workStart);
  const end = toMin(workEnd);
  const bStart = toMin(breakStart);
  const bEnd = toMin(breakEnd);

  while (current + slotDuration <= end) {
    const slotEnd = current + slotDuration;
    if (current >= bStart && current < bEnd) {
      current = bEnd;
      continue;
    }
    if (current < bStart && slotEnd > bStart) {
      current = bEnd;
      continue;
    }
    slots.push({ startTime: toStr(current), endTime: toStr(slotEnd) });
    current = slotEnd;
  }
  return slots;
}

/* ── Status Configuration ── */
export const FLOW_STATUSES = {
  'new-entry':        { label: 'New Entry',        color: '#3B82F6', bg: '#EFF6FF', icon: '🆕' },
  'checked-in':       { label: 'Checked In',       color: '#F59E0B', bg: '#FFFBEB', icon: '📋' },
  'waiting':          { label: 'Waiting',           color: '#F97316', bg: '#FFF7ED', icon: '⏳' },
  'in-consultation':  { label: 'In Consultation',   color: '#EF4444', bg: '#FEF2F2', icon: '🩺' },
  'assessment':       { label: 'Assessment',        color: '#8B5CF6', bg: '#F5F3FF', icon: '🔬' },
  'completed':        { label: 'Completed',         color: '#10B981', bg: '#ECFDF5', icon: '✅' },
  'no-show':          { label: 'No Show',           color: '#6B7280', bg: '#F3F4F6', icon: '❌' },
  'cancelled':        { label: 'Cancelled',         color: '#6B7280', bg: '#F3F4F6', icon: '🚫' },
};

export const APPOINTMENT_STATUSES = {
  'scheduled':  { label: 'Scheduled',  color: '#3B82F6' },
  'completed':  { label: 'Completed',  color: '#10B981' },
  'cancelled':  { label: 'Cancelled',  color: '#6B7280' },
  'no-show':    { label: 'No Show',    color: '#EF4444' },
};

/* ── Toast Notifications ── */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = `toast-${++toastCounter}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Modal ── */
export function showModal(htmlContent) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;
  content.innerHTML = htmlContent;
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('modal-visible'));
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-visible');
  setTimeout(() => overlay.classList.add('hidden'), 300);
}

/* ── Status Badge HTML ── */
export function statusBadge(status, map = FLOW_STATUSES) {
  const s = map[status] || { label: status, color: '#6B7280', icon: '❓' };
  return `<span class="status-badge" style="--badge-color: ${s.color}; --badge-bg: ${s.bg || s.color + '20'}">${s.icon || ''} ${s.label}</span>`;
}

/* ── Time elapsed helper ── */
export function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

export function waitMinutes(timestamp) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}
