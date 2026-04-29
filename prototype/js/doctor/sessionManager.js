/**
 * Session Manager — Doctor consultation progress management logic.
 */
import { store } from '../store.js';
import { showToast } from '../utils.js';
import { eventBus } from '../eventBus.js';

export function startConsultation(visitID) {
  const visit = store.getVisit(visitID);
  if (!visit) return showToast('Visit not found.', 'error');

  // Check if doctor already has someone in consultation
  const doctorID = visit.doctorID;
  const currentConsult = store.getVisits({ doctorID, date: visit.date })
    .find(v => v.flowStatus === 'in-consultation' && v.visitID !== visitID);

  if (currentConsult) {
    return showToast('Doctor already has a patient in consultation. Complete current patient first.', 'warning');
  }

  const result = store.updateVisitStatus(visitID, 'in-consultation');
  if (result.error) showToast(result.error, 'error');
  else showToast(`Consultation started for ${store.getPatient(visit.patientID)?.name || 'patient'}.`, 'info');
  return result;
}

export function moveToAssessment(visitID) {
  const result = store.updateVisitStatus(visitID, 'assessment');
  if (result.error) showToast(result.error, 'error');
  else showToast('Patient moved to assessment.', 'info');
  return result;
}

export function completeConsultation(visitID) {
  const visit = store.getVisit(visitID);
  const result = store.updateVisitStatus(visitID, 'completed');
  if (result.error) showToast(result.error, 'error');
  else {
    showToast('Consultation completed! ✅', 'success');
    // REQ-13: Alert when next patient is ready
    if (visit) {
      const queue = store.getQueue(visit.doctorID, visit.date);
      const nextWaiting = queue.find(v => v.flowStatus === 'waiting');
      if (nextWaiting) {
        const pat = store.getPatient(nextWaiting.patientID);
        setTimeout(() => showToast(`Next patient ready: ${pat?.name || 'Unknown'}`, 'info'), 800);
      }
    }
  }
  return result;
}

export function markNoShow(visitID) {
  const result = store.updateVisitStatus(visitID, 'no-show');
  if (result.error) showToast(result.error, 'error');
  else showToast('Patient marked as No Show.', 'warning');
  return result;
}

export function markNoShowByAppointment(appointmentID) {
  // For patients who never checked in
  const apt = store.getAppointment(appointmentID);
  if (!apt) return;
  apt.status = 'no-show';
  store._save();
  eventBus.emit('appointment:updated', apt);
  showToast('Patient marked as No Show.', 'warning');
}
