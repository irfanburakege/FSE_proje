import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { apiClient } from '../../api/client.js';
import './DoctorAvailability.css';

export default function DoctorAvailability() {
  const { store, showToast } = useStore();
  const doctors = store.getDoctors();
  const [selectedDoctorID, setSelectedDoctorID] = useState(doctors[0]?.doctorID || '');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const dayMapReverse = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  const [weeklySchedule, setWeeklySchedule] = useState({});

  const normalizeTime = (t) => (t ? String(t).substring(0, 5) : '');

  const toDaySlots = (entry) => {
    if (!entry || entry.is_off) return [{ type: 'off', start: 'All Day', end: '' }];
    const rows = [];
    if (entry.work_start && entry.break_start) {
      rows.push({ type: 'work', start: normalizeTime(entry.work_start), end: normalizeTime(entry.break_start) });
    } else if (entry.work_start && entry.work_end) {
      rows.push({ type: 'work', start: normalizeTime(entry.work_start), end: normalizeTime(entry.work_end) });
    }
    if (entry.break_start && entry.break_end) {
      rows.push({ type: 'break', start: normalizeTime(entry.break_start), end: normalizeTime(entry.break_end) });
    }
    if (entry.break_end && entry.work_end) {
      rows.push({ type: 'work', start: normalizeTime(entry.break_end), end: normalizeTime(entry.work_end) });
    }
    return rows.length ? rows : [{ type: 'off', start: 'All Day', end: '' }];
  };

  const scheduleByDay = useMemo(() => {
    const output = {};
    days.forEach((d) => {
      output[d] = toDaySlots(weeklySchedule[d]);
    });
    return output;
  }, [weeklySchedule]);

  useEffect(() => {
    if (!doctors.length) return;
    if (!selectedDoctorID) setSelectedDoctorID(doctors[0].doctorID);
  }, [doctors, selectedDoctorID]);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!selectedDoctorID) return;
      try {
        setIsLoading(true);
        const data = await apiClient.get(`/availability/${selectedDoctorID}`);
        const mapped = {};
        data.forEach((row) => {
          const day = dayMapReverse[row.day_of_week];
          if (!day) return;
          mapped[day] = {
            day_of_week: row.day_of_week,
            work_start: normalizeTime(row.work_start),
            work_end: normalizeTime(row.work_end),
            break_start: normalizeTime(row.break_start),
            break_end: normalizeTime(row.break_end),
            is_off: !!row.is_off,
          };
        });
        setWeeklySchedule(mapped);
      } catch (err) {
        showToast(`Availability could not be loaded: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [selectedDoctorID, showToast]);

  const patchDay = (day, patch) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        day_of_week: dayMap[day],
        work_start: '09:00',
        work_end: '17:00',
        break_start: '',
        break_end: '',
        is_off: false,
        ...(prev[day] || {}),
        ...patch,
      },
    }));
  };

  const addWorkingHours = () => patchDay(selectedDay, { is_off: false, work_start: '09:00', work_end: '17:00' });
  const addBreakTime = () => patchDay(selectedDay, { is_off: false, break_start: '12:00', break_end: '13:00' });
  const markUnavailable = () =>
    patchDay(selectedDay, { is_off: true, work_start: '', work_end: '', break_start: '', break_end: '' });

  const saveChanges = async () => {
    if (!selectedDoctorID) return;
    const payload = days.map((day) => {
      const row = weeklySchedule[day] || {};
      return {
        day_of_week: dayMap[day],
        work_start: row.is_off ? null : row.work_start || null,
        work_end: row.is_off ? null : row.work_end || null,
        break_start: row.is_off ? null : row.break_start || null,
        break_end: row.is_off ? null : row.break_end || null,
        is_off: !!row.is_off,
      };
    });
    try {
      setIsSaving(true);
      await apiClient.put(`/availability/${selectedDoctorID}`, { schedule: payload });
      showToast('Availability saved successfully.', 'success');
    } catch (err) {
      showToast(`Availability save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
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
                disabled={isLoading || isSaving}
              >
                {doctors.map(d => <option key={d.doctorID} value={d.doctorID}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Selected Day</label>
              <select className="form-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} disabled={isLoading || isSaving}>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <hr className="mt-24 mb-24" style={{ borderColor: 'var(--border-light)' }} />
            
            <h4 className="mb-16">Quick Actions</h4>
            <div className="flex flex-col gap-12">
              <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={addWorkingHours} disabled={isLoading || isSaving}>+ Add Working Hours</button>
              <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={addBreakTime} disabled={isLoading || isSaving}>+ Add Break Time</button>
              <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={markUnavailable} disabled={isLoading || isSaving}>Mark as Unavailable</button>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="card">
          <div className="card-header calendar-header">
            <h3>Weekly Schedule Template</h3>
            <button className="btn btn-primary btn-sm" onClick={saveChanges} disabled={isLoading || isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          <div className="card-body">
            {isLoading && <p className="text-muted">Loading schedule...</p>}
            <div className="calendar-days">
              {days.map(day => (
                <div key={day} className="day-col">
                  <div className="day-header">{day}</div>
                  <div className="day-slots">
                    {(scheduleByDay[day] || []).map((slot, idx) => (
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
