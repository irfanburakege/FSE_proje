/**
 * Queue Manager — Queue ordering, priority, and status transition logic.
 */
import { store } from '../store.js';
import { showToast } from '../utils.js';

export function checkInPatient(appointmentID) {
  const result = store.checkInPatient(appointmentID);
  if (result.error) showToast(result.error, 'warning');
  else showToast(`Patient checked in successfully!`, 'success');
  return result;
}

export function setEmergencyPriority(visitID) {
  store.setPriority(visitID, 'emergency');
  showToast('🚨 Patient flagged as EMERGENCY — moved to front of queue.', 'warning');
}

export function setNormalPriority(visitID) {
  store.setPriority(visitID, 'normal');
  showToast('Priority reset to normal.', 'info');
}

export function updateFlowStatus(visitID, newStatus) {
  const result = store.updateVisitStatus(visitID, newStatus);
  if (result.error) showToast(result.error, 'error');
  return result;
}
