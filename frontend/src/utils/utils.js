/**
 * Shared utility functions: date/time formatting, ID generation,
 * status configuration, and time elapsed helpers.
 * 
 * DOM-manipulating utilities (showToast, showModal, closeModal) are now
 * React components — see Toast.jsx and Modal.jsx.
 */

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

export function formatDateShort(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year.slice(2)}`;
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
  'new-entry': { label: 'New Entry', color: '#6366F1', bg: '#EEF2FF', icon: '🆕' },
  'checked-in': { label: 'Checked In', color: '#8B5CF6', bg: '#F5F3FF', icon: '📋' },
  'waiting': { label: 'Waiting', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  'in-consultation': { label: 'In Consultation', color: '#10B981', bg: '#D1FAE5', icon: '🩺' },
  'assessment': { label: 'Assessment', color: '#8B5CF6', bg: '#F5F3FF', icon: '🔬' },
  'completed': { label: 'Completed', color: '#059669', bg: '#D1FAE5', icon: '✅' },
  'no-show': { label: 'No Show', color: '#6B7280', bg: '#F3F4F6', icon: '❌' },
  'cancelled': { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6', icon: '🚫' },
};

export const APPOINTMENT_STATUSES = {
  'scheduled': { label: 'Scheduled', color: '#6366F1' },
  'completed': { label: 'Completed', color: '#10B981' },
  'cancelled': { label: 'Cancelled', color: '#6B7280' },
  'no-show': { label: 'No Show', color: '#EF4444' },
};

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

/* ── Department icon helper ── */
export function getDepartmentIcon(iconName) {
  if (!iconName) return '🏥';
  const key = String(iconName).trim().toLowerCase();
  const iconMap = {
    'heart-pulse': '❤️',
    'heart': '❤️',
    'brain': '🧠',
    'truck-medical': '🚑',
    'stethoscope': '🩺',
    'activity': '📈',
    'hospital': '🏥',
    'syringe': '💉',
    'baby': '👶',
    'scan': '🧾',
    'eye': '👁️',
    'bone': '🦴',
  };
  return iconMap[key] || '🏥';
}
