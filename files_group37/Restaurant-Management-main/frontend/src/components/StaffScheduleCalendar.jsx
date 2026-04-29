import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useEffect, useState } from 'react';
import { parseISO, format, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import tr from 'date-fns/locale/tr';

const locales = {
  'tr-TR': tr,
};
const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => 1, // Pazartesi
  getDay,
  locales,
});

export default function StaffScheduleCalendar() {
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    staff_id: '',
    date: '',
    start_time: '',
    end_time: ''
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Çalışanları çek
    fetch('http://localhost:3000/staff')
      .then(res => res.json())
      .then(staffData => setStaffList(staffData));

    // Çalışma saatlerini çek
    fetch('http://localhost:3000/staff_schedule')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, [success]); // success değişince tekrar çek

  const eventsWithNames = events.map(item => {
    const staff = staffList.find(s => s.id === item.staff_id);
    return {
      id: item.id,
      title: staff ? staff.name : `Çalışan ID: ${item.staff_id}`,
      start: item.start_datetime ? parseISO(item.start_datetime) : new Date(),
      end: item.end_datetime ? parseISO(item.end_datetime) : new Date(),
    };
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAdding(true);
    // Form validasyonu
    if (!form.staff_id || !form.date || !form.start_time || !form.end_time) {
      setError('Tüm alanları doldurun.');
      setAdding(false);
      return;
    }
    // Tarih ve saatleri birleştir
    const start_datetime = `${form.date}T${form.start_time}:00`;
    const end_datetime = `${form.date}T${form.end_time}:00`;
    try {
      const res = await fetch('http://localhost:3000/staff_schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: form.staff_id,
          start_datetime,
          end_datetime
        })
      });
      if (!res.ok) throw new Error('Vardiya eklenemedi');
      setSuccess('Vardiya başarıyla eklendi!');
      setForm({ staff_id: '', date: '', start_time: '', end_time: '' });
    } catch (err) {
      setError('Vardiya eklenirken hata oluştu.');
    } finally {
      setAdding(false);
    }
  };

  // Vardiya silme fonksiyonu
  const handleDeleteShift = async (event) => {
    if (!window.confirm(`"${event.title}" adlı vardiyayı silmek istiyor musunuz?`)) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:3000/staff_schedule/${event.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Vardiya silinemedi');
      setSuccess('Vardiya başarıyla silindi!');
    } catch (err) {
      setError('Vardiya silinirken hata oluştu.');
    }
  };

  return (
    <div style={{ height: 500, marginTop: 40 }}>
      <h2 style={{ marginBottom: 16 }}>Çalışan Çalışma Takvimi</h2>
      <Calendar
        localizer={localizer}
        events={eventsWithNames}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 400 }}
        views={['month', 'week', 'day']}
        defaultView="week"
        defaultDate={new Date('2024-05-13')}
        messages={{
          week: 'Hafta',
          work_week: 'İş Haftası',
          day: 'Gün',
          month: 'Ay',
          previous: 'Geri',
          next: 'İleri',
          today: 'Bugün',
          agenda: 'Ajanda',
          date: 'Tarih',
          time: 'Saat',
          event: 'Çalışma',
        }}
        onSelectEvent={handleDeleteShift}
      />
      <div style={{ marginTop: 32, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #0001', maxWidth: 500 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Yeni Vardiya Ekle</h3>
        <form onSubmit={handleAddShift} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Çalışan:
            <select name="staff_id" value={form.staff_id} onChange={handleFormChange} required style={{ marginLeft: 8 }}>
              <option value="">Seçiniz</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          </label>
          <label>
            Tarih:
            <input type="date" name="date" value={form.date} onChange={handleFormChange} required style={{ marginLeft: 8 }} />
          </label>
          <label>
            Başlangıç Saati:
            <input type="time" name="start_time" value={form.start_time} onChange={handleFormChange} required style={{ marginLeft: 8 }} />
          </label>
          <label>
            Bitiş Saati:
            <input type="time" name="end_time" value={form.end_time} onChange={handleFormChange} required style={{ marginLeft: 8 }} />
          </label>
          <button type="submit" disabled={adding} style={{ marginTop: 12, padding: '8px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            {adding ? 'Ekleniyor...' : 'Ekle'}
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        </form>
      </div>
    </div>
  );
}
