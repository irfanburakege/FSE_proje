import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import './DoctorAvailability.css';

export default function DoctorAvailability() {
  const { store } = useStore();
  const [selectedDoctorID, setSelectedDoctorID] = useState('DOC-01');
  const doctors = store.getDoctors();
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Mock schedule data for the UI
  const mockSchedule = {
    'Mon': [{ type: 'work', start: '09:00', end: '12:00' }, { type: 'break', start: '12:00', end: '13:00' }, { type: 'work', start: '13:00', end: '17:00' }],
    'Tue': [{ type: 'work', start: '09:00', end: '12:00' }, { type: 'break', start: '12:00', end: '13:00' }, { type: 'work', start: '13:00', end: '17:00' }],
    'Wed': [{ type: 'work', start: '09:00', end: '12:00' }, { type: 'break', start: '12:00', end: '13:00' }, { type: 'work', start: '13:00', end: '17:00' }],
    'Thu': [{ type: 'work', start: '09:00', end: '12:00' }, { type: 'break', start: '12:00', end: '13:00' }, { type: 'work', start: '13:00', end: '17:00' }],
    'Fri': [{ type: 'work', start: '09:00', end: '12:00' }, { type: 'break', start: '12:00', end: '13:00' }],
    'Sat': [{ type: 'off', start: 'All Day', end: '' }],
    'Sun': [{ type: 'off', start: 'All Day', end: '' }]
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <h2>📅 Doctor Availability Management</h2>
          <p className="page-subtitle">Configure working hours, breaks, and days off for doctors</p>
        </div>
      </div>

      <div className="availability-grid">
        {/* Sidebar Controls */}
        <div className="card">
          <div className="card-header">
            <h3>Configuration</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Select Doctor</label>
              <select 
                className="form-select"
                value={selectedDoctorID}
                onChange={(e) => setSelectedDoctorID(e.target.value)}
              >
                {doctors.map(d => <option key={d.doctorID} value={d.doctorID}>{d.name}</option>)}
              </select>
            </div>
            
            <hr className="mt-24 mb-24" style={{ borderColor: 'var(--border-light)' }} />
            
            <h4 className="mb-16">Quick Actions</h4>
            <div className="flex flex-col gap-12">
              <button className="btn btn-outline" style={{ justifyContent: 'center' }}>+ Add Working Hours</button>
              <button className="btn btn-outline" style={{ justifyContent: 'center' }}>+ Add Break Time</button>
              <button className="btn btn-danger" style={{ justifyContent: 'center' }}>Mark as Unavailable</button>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="card">
          <div className="card-header calendar-header">
            <h3>Weekly Schedule Template</h3>
            <button className="btn btn-primary btn-sm">Save Changes</button>
          </div>
          <div className="card-body">
            <div className="calendar-days">
              {days.map(day => (
                <div key={day} className="day-col">
                  <div className="day-header">{day}</div>
                  <div className="day-slots">
                    {mockSchedule[day].map((slot, idx) => (
                      <div key={idx} className={`slot-card slot-${slot.type}`} title="Click to edit">
                        {slot.start} {slot.end && `- ${slot.end}`}
                        <div style={{ fontSize: '0.7rem', marginTop: '4px', textTransform: 'capitalize' }}>
                          {slot.type === 'work' ? 'Working Hours' : slot.type === 'break' ? 'Break' : 'Day Off'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
