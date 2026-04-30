/**
 * Data Store — Central data layer implementing the domain model.
 * 11 entities: Patient, Appointment, Doctor, Department, TimeSlot,
 * PatientVisit, Queue, DoctorSchedule, Notification, Receptionist, Report.
 * Persists to localStorage, emits events via EventBus.
 */
import { eventBus } from './eventBus.js';
import { generateID, getToday, generateTimeSlots } from '../utils/utils.js';

const STORAGE_KEY = 'smartClinic_v1';

/* ════════════════════════════════════════════
   DEFAULT MOCK DATA
   ════════════════════════════════════════════ */
function createDefaults() {
  const today = getToday();

  const departments = [
    { deptID: 'DEP-01', name: 'General Practice', slotDuration: 15, icon: '🏥', color: '#0EA5E9' },
    { deptID: 'DEP-02', name: 'Cardiology',       slotDuration: 30, icon: '❤️', color: '#EF4444' },
    { deptID: 'DEP-03', name: 'Orthopedics',      slotDuration: 30, icon: '🦴', color: '#F59E0B' },
    { deptID: 'DEP-04', name: 'Pediatrics',        slotDuration: 15, icon: '👶', color: '#10B981' },
    { deptID: 'DEP-05', name: 'Neurology',         slotDuration: 30, icon: '🧠', color: '#8B5CF6' },
  ];

  const doctors = [
    { doctorID: 'DOC-01', name: 'Dr. Ayşe Yılmaz',   specialization: 'General Practice', departmentID: 'DEP-01' },
    { doctorID: 'DOC-02', name: 'Dr. Mehmet Kaya',    specialization: 'General Practice', departmentID: 'DEP-01' },
    { doctorID: 'DOC-03', name: 'Dr. Elif Demir',     specialization: 'Cardiology',       departmentID: 'DEP-02' },
    { doctorID: 'DOC-04', name: 'Dr. Can Özkan',      specialization: 'Cardiology',       departmentID: 'DEP-02' },
    { doctorID: 'DOC-05', name: 'Dr. Burak Çelik',    specialization: 'Orthopedics',      departmentID: 'DEP-03' },
    { doctorID: 'DOC-06', name: 'Dr. Zeynep Arslan',  specialization: 'Orthopedics',      departmentID: 'DEP-03' },
    { doctorID: 'DOC-07', name: 'Dr. Selin Aydın',    specialization: 'Pediatrics',       departmentID: 'DEP-04' },
    { doctorID: 'DOC-08', name: 'Dr. Emre Şahin',     specialization: 'Pediatrics',       departmentID: 'DEP-04' },
    { doctorID: 'DOC-09', name: 'Dr. Deniz Koç',      specialization: 'Neurology',        departmentID: 'DEP-05' },
    { doctorID: 'DOC-10', name: 'Dr. Hakan Yıldız',   specialization: 'Neurology',        departmentID: 'DEP-05' },
  ];

  const schedules = doctors.map(d => ({
    scheduleID: `SCH-${d.doctorID}`, doctorID: d.doctorID, date: today,
    workStart: '09:00', workEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', maxPatients: 16,
  }));

  const patients = [
    { patientID: 'PAT-01', name: 'Ali Yıldırım',    phone: '0532-111-2233', email: 'ali@mail.com' },
    { patientID: 'PAT-02', name: 'Fatma Kara',       phone: '0533-222-3344', email: 'fatma@mail.com' },
    { patientID: 'PAT-03', name: 'Hasan Demir',      phone: '0534-333-4455', email: 'hasan@mail.com' },
    { patientID: 'PAT-04', name: 'Aylin Öztürk',     phone: '0535-444-5566', email: 'aylin@mail.com' },
    { patientID: 'PAT-05', name: 'Mustafa Çetin',    phone: '0536-555-6677', email: 'mustafa@mail.com' },
    { patientID: 'PAT-06', name: 'Elif Sarı',        phone: '0537-666-7788', email: 'elif@mail.com' },
    { patientID: 'PAT-07', name: 'Ahmet Acar',       phone: '0538-777-8899', email: 'ahmet@mail.com' },
    { patientID: 'PAT-08', name: 'Zehra Koçak',      phone: '0539-888-9900', email: 'zehra@mail.com' },
    { patientID: 'PAT-09', name: 'Oğuz Erdoğan',     phone: '0541-999-0011', email: 'oguz@mail.com' },
    { patientID: 'PAT-10', name: 'Seda Arslan',      phone: '0542-000-1122', email: 'seda@mail.com' },
    { patientID: 'PAT-11', name: 'Kemal Yılmaz',     phone: '0543-111-2233', email: 'kemal@mail.com' },
    { patientID: 'PAT-12', name: 'Derya Şen',        phone: '0544-222-3344', email: 'derya@mail.com' },
    { patientID: 'PAT-13', name: 'Burak Tan',        phone: '0545-333-4455', email: 'burak@mail.com' },
    { patientID: 'PAT-14', name: 'Merve Aktaş',      phone: '0546-444-5566', email: 'merve@mail.com' },
    { patientID: 'PAT-15', name: 'Volkan Güneş',     phone: '0547-555-6677', email: 'volkan@mail.com' },
  ];

  // Pre-populated appointments for demo (today)
  const appointments = [
    { appointmentID: 'APT-001', patientID: 'PAT-01', doctorID: 'DOC-01', departmentID: 'DEP-01', date: today, timeSlot: '09:00', endTime: '09:15', status: 'scheduled' },
    { appointmentID: 'APT-002', patientID: 'PAT-02', doctorID: 'DOC-01', departmentID: 'DEP-01', date: today, timeSlot: '09:15', endTime: '09:30', status: 'scheduled' },
    { appointmentID: 'APT-003', patientID: 'PAT-03', doctorID: 'DOC-01', departmentID: 'DEP-01', date: today, timeSlot: '09:30', endTime: '09:45', status: 'scheduled' },
    { appointmentID: 'APT-004', patientID: 'PAT-04', doctorID: 'DOC-03', departmentID: 'DEP-02', date: today, timeSlot: '09:00', endTime: '09:30', status: 'scheduled' },
    { appointmentID: 'APT-005', patientID: 'PAT-05', doctorID: 'DOC-03', departmentID: 'DEP-02', date: today, timeSlot: '09:30', endTime: '10:00', status: 'scheduled' },
    { appointmentID: 'APT-006', patientID: 'PAT-06', doctorID: 'DOC-05', departmentID: 'DEP-03', date: today, timeSlot: '10:00', endTime: '10:30', status: 'scheduled' },
    { appointmentID: 'APT-007', patientID: 'PAT-07', doctorID: 'DOC-07', departmentID: 'DEP-04', date: today, timeSlot: '09:00', endTime: '09:15', status: 'scheduled' },
    { appointmentID: 'APT-008', patientID: 'PAT-08', doctorID: 'DOC-09', departmentID: 'DEP-05', date: today, timeSlot: '09:00', endTime: '09:30', status: 'scheduled' },
    { appointmentID: 'APT-009', patientID: 'PAT-09', doctorID: 'DOC-03', departmentID: 'DEP-02', date: today, timeSlot: '10:00', endTime: '10:30', status: 'scheduled' },
    { appointmentID: 'APT-010', patientID: 'PAT-10', doctorID: 'DOC-05', departmentID: 'DEP-03', date: today, timeSlot: '10:30', endTime: '11:00', status: 'scheduled' },
  ];

  const visits = [];
  const notifications = [];
  const receptionists = [
    { staffID: 'REC-01', name: 'Gül Yılmaz', shift: 'Morning' },
    { staffID: 'REC-02', name: 'Murat Aksoy', shift: 'Afternoon' },
  ];

  return { departments, doctors, schedules, patients, appointments, visits, notifications, receptionists, currentPatientID: 'PAT-01' };
}

/* ════════════════════════════════════════════
   STORE CLASS
   ════════════════════════════════════════════ */
class Store {
  constructor() {
    this.data = this._load() || createDefaults();
    this._save();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  reset() {
    this.data = createDefaults();
    this._save();
    eventBus.emit('store:reset');
  }

  /* ── Getters ── */
  getDepartments()           { return this.data.departments; }
  getDepartment(id)          { return this.data.departments.find(d => d.deptID === id); }
  getDoctors()               { return this.data.doctors; }
  getDoctor(id)              { return this.data.doctors.find(d => d.doctorID === id); }
  getDoctorsByDept(deptID)   { return this.data.doctors.filter(d => d.departmentID === deptID); }
  getPatients()              { return this.data.patients; }
  getPatient(id)             { return this.data.patients.find(p => p.patientID === id); }
  getSchedule(doctorID, date){ return this.data.schedules.find(s => s.doctorID === doctorID && s.date === (date || getToday())); }
  getReceptionists()         { return this.data.receptionists; }
  getCurrentPatientID()      { return this.data.currentPatientID; }
  setCurrentPatient(id)      { this.data.currentPatientID = id; this._save(); }

  /* ── Appointments ── */
  getAppointments(filters = {}) {
    let list = this.data.appointments;
    if (filters.date)      list = list.filter(a => a.date === filters.date);
    if (filters.doctorID)  list = list.filter(a => a.doctorID === filters.doctorID);
    if (filters.patientID) list = list.filter(a => a.patientID === filters.patientID);
    if (filters.status)    list = list.filter(a => a.status === filters.status);
    if (filters.departmentID) list = list.filter(a => a.departmentID === filters.departmentID);
    return list;
  }

  getAppointment(id) { return this.data.appointments.find(a => a.appointmentID === id); }

  createAppointment({ patientID, doctorID, departmentID, date, timeSlot, endTime }) {
    // REQ-15: Prevent double-booking
    const conflict = this.data.appointments.find(a =>
      a.doctorID === doctorID && a.date === date && a.timeSlot === timeSlot && a.status !== 'cancelled'
    );
    if (conflict) return { error: 'This time slot is already booked.' };

    // REQ-14: Session limit check
    const schedule = this.getSchedule(doctorID, date);
    if (schedule) {
      const dayAppts = this.getAppointments({ doctorID, date }).filter(a => a.status !== 'cancelled');
      if (dayAppts.length >= schedule.maxPatients) return { error: 'Doctor has reached the maximum patient limit for this day.' };
    }

    const apt = {
      appointmentID: generateID('APT'), patientID, doctorID, departmentID,
      date, timeSlot, endTime, status: 'scheduled', createdAt: new Date().toISOString(),
    };
    this.data.appointments.push(apt);
    this._save();
    this._notify('appointment-confirmation', patientID, `Appointment confirmed for ${date} at ${timeSlot}`);
    eventBus.emit('appointment:created', apt);
    return { success: true, appointment: apt };
  }

  cancelAppointment(appointmentID) {
    const apt = this.getAppointment(appointmentID);
    if (!apt) return { error: 'Appointment not found.' };
    apt.status = 'cancelled';
    // Remove associated visit if exists
    this.data.visits = this.data.visits.filter(v => v.appointmentID !== appointmentID);
    this._save();
    this._notify('appointment-cancellation', apt.patientID, `Appointment ${appointmentID} cancelled.`);
    eventBus.emit('appointment:cancelled', apt);
    return { success: true };
  }

  rescheduleAppointment(appointmentID, newDate, newTimeSlot, newEndTime) {
    const apt = this.getAppointment(appointmentID);
    if (!apt) return { error: 'Appointment not found.' };
    const conflict = this.data.appointments.find(a =>
      a.doctorID === apt.doctorID && a.date === newDate && a.timeSlot === newTimeSlot
      && a.status !== 'cancelled' && a.appointmentID !== appointmentID
    );
    if (conflict) return { error: 'New time slot is already booked.' };
    apt.date = newDate; apt.timeSlot = newTimeSlot; apt.endTime = newEndTime; apt.status = 'scheduled';
    this.data.visits = this.data.visits.filter(v => v.appointmentID !== appointmentID);
    this._save();
    this._notify('appointment-reschedule', apt.patientID, `Appointment rescheduled to ${newDate} at ${newTimeSlot}`);
    eventBus.emit('appointment:updated', apt);
    return { success: true, appointment: apt };
  }

  /* ── Available Slots ── */
  getAvailableSlots(doctorID, date) {
    const schedule = this.getSchedule(doctorID, date);
    if (!schedule) return [];
    const dept = this.getDepartment(this.getDoctor(doctorID)?.departmentID);
    if (!dept) return [];
    const allSlots = generateTimeSlots(schedule.workStart, schedule.workEnd, schedule.breakStart, schedule.breakEnd, dept.slotDuration);
    const booked = this.getAppointments({ doctorID, date }).filter(a => a.status !== 'cancelled').map(a => a.timeSlot);
    return allSlots.map(s => ({ ...s, isAvailable: !booked.includes(s.startTime) }));
  }

  /* ── Patient Visits (Flow Tracking) ── */
  getVisits(filters = {}) {
    let list = this.data.visits;
    if (filters.date)     list = list.filter(v => v.date === filters.date);
    if (filters.doctorID) list = list.filter(v => v.doctorID === filters.doctorID);
    if (filters.status)   list = list.filter(v => v.flowStatus === filters.status);
    return list;
  }

  getVisit(id)          { return this.data.visits.find(v => v.visitID === id); }
  getVisitByAppt(aptID) { return this.data.visits.find(v => v.appointmentID === aptID); }

  checkInPatient(appointmentID) {
    const apt = this.getAppointment(appointmentID);
    if (!apt) return { error: 'Appointment not found.' };
    const existing = this.getVisitByAppt(appointmentID);
    if (existing) return { error: 'Patient already checked in.' };

    const visit = {
      visitID: generateID('VIS'), appointmentID, patientID: apt.patientID,
      doctorID: apt.doctorID, date: apt.date, checkInTime: new Date().toISOString(),
      flowStatus: 'checked-in', priority: 'normal',
    };
    this.data.visits.push(visit);
    this._save();
    eventBus.emit('patient:checkedIn', visit);
    // Auto transition to waiting after brief delay
    setTimeout(() => { this.updateVisitStatus(visit.visitID, 'waiting'); }, 500);
    return { success: true, visit };
  }

  updateVisitStatus(visitID, newStatus) {
    const visit = this.getVisit(visitID);
    if (!visit) return { error: 'Visit not found.' };
    const oldStatus = visit.flowStatus;
    visit.flowStatus = newStatus;

    if (newStatus === 'completed' || newStatus === 'no-show') {
      const apt = this.getAppointment(visit.appointmentID);
      if (apt) apt.status = newStatus === 'no-show' ? 'no-show' : 'completed';
    }
    if (newStatus === 'in-consultation') { visit.consultStartTime = new Date().toISOString(); }
    if (newStatus === 'completed') { visit.completedTime = new Date().toISOString(); }

    this._save();
    eventBus.emit('patient:statusChanged', { visit, oldStatus, newStatus });
    return { success: true, visit };
  }

  setPriority(visitID, priority) {
    const visit = this.getVisit(visitID);
    if (!visit) return;
    visit.priority = priority;
    this._save();
    eventBus.emit('queue:updated', { visitID, priority });
  }

  /* ── Queue helpers ── */
  getQueue(doctorID, date) {
    const d = date || getToday();
    return this.data.visits
      .filter(v => v.doctorID === doctorID && v.date === d && !['completed', 'no-show', 'cancelled'].includes(v.flowStatus))
      .sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (b.priority === 'emergency' && a.priority !== 'emergency') return 1;
        return new Date(a.checkInTime) - new Date(b.checkInTime);
      });
  }

  getAllQueues(date) {
    const d = date || getToday();
    return this.data.visits
      .filter(v => v.date === d && !['completed', 'no-show', 'cancelled'].includes(v.flowStatus))
      .sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (b.priority === 'emergency' && a.priority !== 'emergency') return 1;
        return new Date(a.checkInTime) - new Date(b.checkInTime);
      });
  }

  /* ── Doctor status helper ── */
  getDoctorStatus(doctorID, date) {
    const d = date || getToday();
    const visits = this.data.visits.filter(v => v.doctorID === doctorID && v.date === d);
    const inConsult = visits.find(v => v.flowStatus === 'in-consultation');
    if (inConsult) return 'in-consultation';
    const waiting = visits.filter(v => v.flowStatus === 'waiting' || v.flowStatus === 'checked-in');
    if (waiting.length > 0) return 'available';
    return 'available';
  }

  /* ── Stats ── */
  getDayStats(date) {
    const d = date || getToday();
    const apts = this.getAppointments({ date: d });
    const visits = this.data.visits.filter(v => v.date === d);
    return {
      total: apts.filter(a => a.status !== 'cancelled').length,
      scheduled: apts.filter(a => a.status === 'scheduled').length,
      completed: visits.filter(v => v.flowStatus === 'completed').length,
      inConsultation: visits.filter(v => v.flowStatus === 'in-consultation').length,
      waiting: visits.filter(v => ['waiting', 'checked-in'].includes(v.flowStatus)).length,
      noShow: visits.filter(v => v.flowStatus === 'no-show').length,
      assessment: visits.filter(v => v.flowStatus === 'assessment').length,
    };
  }

  /* ── Notifications (basic in-app) ── */
  _notify(type, patientID, message) {
    const notif = { notifID: generateID('NOT'), type, patientID, message, timestamp: new Date().toISOString(), read: false };
    this.data.notifications.push(notif);
    this._save();
  }

  getNotifications(patientID) {
    return this.data.notifications.filter(n => n.patientID === patientID).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export const store = new Store();
