import { eventBus } from './eventBus.js';
import { generateID, getToday, generateTimeSlots, getDepartmentIcon } from '../utils/utils.js';
import { apiClient } from '../api/client.js';

class Store {
  constructor() {
    this.data = {
      departments: [],
      doctors: [],
      schedules: [],
      patients: [],
      appointments: [],
      visits: [],
      notifications: [],
      receptionists: [
        { staffID: 'REC-01', name: 'Gül Yılmaz', shift: 'Morning' },
        { staffID: 'REC-02', name: 'Murat Aksoy', shift: 'Afternoon' },
      ],
      currentPatientID: '1',
      stats: { total: 0, waiting: 0, inConsultation: 0, assessment: 0, completed: 0, noShow: 0, scheduled: 0 }
    };
  }

  async fetchAllData() {
    try {
      const today = getToday();
      const [depts, docs, pats, appts, visits, stats] = await Promise.all([
        apiClient.get('/departments'),
        apiClient.get('/doctors'),
        apiClient.get('/patients'),
        apiClient.get('/appointments'),
        apiClient.get(`/visits?date=${today}`),
        apiClient.get(`/stats/daily?date=${today}`)
      ]);

      // Map DB schema to frontend expected fields
      this.data.departments = depts.map(d => ({
        ...d,
        deptID: d.id?.toString(),
        icon: getDepartmentIcon(d.icon),
        slotDuration: 15,
        color: '#0EA5E9'
      }));
      this.data.doctors = docs.map(d => ({ ...d, doctorID: d.id?.toString(), departmentID: d.department_id?.toString() }));
      this.data.schedules = docs.map(d => ({
        scheduleID: `SCH-${d.id}`, doctorID: d.id?.toString(),
        workStart: '09:00', workEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', maxPatients: d.daily_patient_limit,
      }));
      this.data.patients = pats.map(p => ({ ...p, patientID: p.id?.toString(), phone: p.phone_number }));
      
      this.data.appointments = appts.map(a => {
        const timeObj = new Date(a.appointment_time);
        return {
          ...a, 
          appointmentID: a.id?.toString(), 
          patientID: a.patient_id?.toString(), 
          doctorID: a.doctor_id?.toString(),
          departmentID: this.data.doctors.find(doc => doc.doctorID === a.doctor_id?.toString())?.departmentID,
          date: timeObj.toISOString().split('T')[0],
          timeSlot: timeObj.toTimeString().substring(0,5),
          endTime: new Date(timeObj.getTime() + 15*60000).toTimeString().substring(0,5),
          status: a.status.toLowerCase()
        };
      });

      this.data.visits = visits.map(v => ({
        ...v,
        visitID: v.id?.toString(), // patient_flow ID
        appointmentID: v.appointment_id?.toString(),
        patientID: v.patient_id?.toString(),
        doctorID: v.doctor_id?.toString(),
        date: new Date(v.appointment_time).toISOString().split('T')[0],
        checkInTime: v.check_in_time,
        consultStartTime: v.consultation_start,
        completedTime: v.consultation_end,
        flowStatus: v.status.toLowerCase().replace(' ', '-'),
        priority: (v.priority_level || 'Normal').toLowerCase()
      }));

      this.data.stats = stats;
      eventBus.emit('store:updated');
    } catch (err) {
      console.error("Error fetching data from API:", err);
      throw err;
    }
  }

  /* ── Getters (Synchronous from local mapped data) ── */
  getDepartments()           { return this.data.departments; }
  getDepartment(id)          { return this.data.departments.find(d => d.deptID === id); }
  getDoctors()               { return [...this.data.doctors].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })); }
  getDoctor(id)              { return this.data.doctors.find(d => d.doctorID === id); }
  getDoctorsByDept(deptID)   { return this.data.doctors.filter(d => d.departmentID === deptID).sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })); }
  getPatients()              { return [...this.data.patients].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })); }
  getPatient(id)             { return this.data.patients.find(p => p.patientID === id); }
  getSchedule(doctorID, date){ return this.data.schedules.find(s => s.doctorID === doctorID); }
  getReceptionists()         { return this.data.receptionists; }
  getCurrentPatientID()      { return this.data.currentPatientID; }
  setCurrentPatient(id)      { this.data.currentPatientID = id; eventBus.emit('store:updated'); }

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

  getVisits(filters = {}) {
    let list = this.data.visits;
    if (filters.date)     list = list.filter(v => v.date === filters.date);
    if (filters.doctorID) list = list.filter(v => v.doctorID === filters.doctorID);
    if (filters.status)   list = list.filter(v => v.flowStatus === filters.status);
    return list;
  }
  getVisit(id)          { return this.data.visits.find(v => v.visitID === id); }
  getVisitByAppt(aptID) { return this.data.visits.find(v => v.appointmentID === aptID); }

  getQueue(doctorID, date) {
    const d = date || getToday();
    return this.data.visits
      .filter(v => v.doctorID === doctorID && v.date === d && !['completed', 'no-show', 'cancelled'].includes(v.flowStatus))
      .sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
        return new Date(a.checkInTime) - new Date(b.checkInTime);
      });
  }

  getAllQueues(date) {
    const d = date || getToday();
    return this.data.visits
      .filter(v => v.date === d && !['completed', 'no-show', 'cancelled'].includes(v.flowStatus))
      .sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
        return new Date(a.checkInTime) - new Date(b.checkInTime);
      });
  }

  getDoctorStatus(doctorID, date) {
    const d = date || getToday();
    const visits = this.data.visits.filter(v => v.doctorID === doctorID && v.date === d);
    if (visits.find(v => v.flowStatus === 'in-consultation')) return 'in-consultation';
    if (visits.filter(v => v.flowStatus === 'waiting' || v.flowStatus === 'checked-in').length > 0) return 'available';
    return 'available';
  }

  getDayStats() {
    return {
      total: parseInt(this.data.stats.total) || 0,
      scheduled: parseInt(this.data.stats.scheduled) || 0,
      completed: parseInt(this.data.stats.completed) || 0,
      inConsultation: parseInt(this.data.stats.inconsultation) || 0,
      waiting: parseInt(this.data.stats.waiting) || 0,
      noShow: parseInt(this.data.stats.noshow) || 0,
      assessment: parseInt(this.data.stats.assessment) || 0,
    };
  }

  getNotifications(patientID) {
    return this.data.notifications.filter(n => n.patientID === patientID).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getAvailableSlots(doctorID, date) {
    const schedule = this.getSchedule(doctorID, date);
    if (!schedule) return [];
    const dept = this.getDepartment(this.getDoctor(doctorID)?.departmentID);
    if (!dept) return [];
    const allSlots = generateTimeSlots(schedule.workStart, schedule.workEnd, schedule.breakStart, schedule.breakEnd, dept.slotDuration);
    const booked = this.getAppointments({ doctorID, date }).filter(a => a.status !== 'cancelled').map(a => a.timeSlot);
    return allSlots.map(s => ({ ...s, isAvailable: !booked.includes(s.startTime) }));
  }

  /* ── Async Actions (Mutations) ── */
  async createAppointment({ patientID, doctorID, date, timeSlot }) {
    try {
      const appointment_time = `${date}T${timeSlot}:00`;
      const appointment = await apiClient.post('/appointments', {
        patient_id: parseInt(patientID),
        doctor_id: parseInt(doctorID),
        appointment_time,
        priority_level: 'Normal'
      });
      await this.fetchAllData();
      return { success: true, appointment: { ...appointment, appointmentID: appointment.id?.toString() } };
    } catch (err) {
      return { error: err.message };
    }
  }
  async createPatient({ name, phone_number, national_id }) {
    try {
      const patient = await apiClient.post('/patients', {
        name,
        phone_number,
        national_id
      });
      await this.fetchAllData();
      return { success: true, patient: { ...patient, patientID: patient.id?.toString() } };
    } catch (err) {
      return { error: err.message };
    }
  }


  async cancelAppointment(appointmentID) {
    try {
      await apiClient.put(`/appointments/${appointmentID}/status`, { status: 'Cancelled' });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async updateAppointmentStatus(appointmentID, newStatus) {
    try {
      const dbStatusMap = {
        'requested': 'Requested',
        'confirmed': 'Confirmed',
        'waiting': 'Waiting',
        'in-consultation': 'In Consultation',
        'assessment': 'Assessment',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'no-show': 'No-Show'
      };
      await apiClient.put(`/appointments/${appointmentID}/status`, { status: dbStatusMap[newStatus] || newStatus });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async rescheduleAppointment(appointmentID, newDate, newTimeSlot) {
    try {
      const appointment_time = `${newDate}T${newTimeSlot}:00`;
      await apiClient.put(`/appointments/${appointmentID}/reschedule`, { appointment_time });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async checkInPatient(appointmentID) {
    try {
      await apiClient.post('/visits/checkin', { appointment_id: parseInt(appointmentID) });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async updateVisitStatus(visitID, newStatus) {
    try {
      // Find the appointment ID for this visit
      const visit = this.getVisit(visitID);
      if (!visit) return { error: 'Visit not found locally' };
      
      // DB expects Title Case statuses: 'In Consultation', 'Completed', etc.
      const dbStatusMap = {
        'waiting': 'Waiting',
        'in-consultation': 'In Consultation',
        'assessment': 'Assessment',
        'completed': 'Completed',
        'no-show': 'No-Show'
      };
      
      await apiClient.put(`/visits/${visit.appointmentID}/status`, { status: dbStatusMap[newStatus] || newStatus });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }

  async setPriority(visitID, priority) {
    try {
      const visit = this.getVisit(visitID);
      if (!visit) return { error: 'Visit not found locally' };
      const dbPriority = priority === 'emergency' ? 'Emergency' : 'Normal';
      await apiClient.put(`/appointments/${visit.appointmentID}/priority`, { priority_level: dbPriority });
      await this.fetchAllData();
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  }
}

export const store = new Store();
