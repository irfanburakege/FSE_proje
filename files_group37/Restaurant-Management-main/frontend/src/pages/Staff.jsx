import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import StaffScheduleCalendar from '../components/StaffScheduleCalendar';
import { parseISO, format, getDay } from 'date-fns';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR');
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    hire_date: '',
    type: '',
    phone: '',
    email: '',
    address: '',
    salary: '',
    username: '',
    password: '',
    is_active: true
  });
  const [success, setSuccess] = useState('');
  const [editModal, setEditModal] = useState({ open: false, person: null });
  const [editForm, setEditForm] = useState({
    name: '',
    hire_date: '',
    type: '',
    phone: '',
    email: '',
    address: '',
    salary: '',
    username: '',
    password: '',
    is_active: true
  });
  const [addStartTime, setAddStartTime] = useState('');
  const [addEndTime, setAddEndTime] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    const fetchStaff = async () => {
      try {
        const response = await fetch('http://localhost:3000/staff');
        if (!response.ok) throw new Error('Çalışanlar yüklenemedi');
        const data = await response.json();
        setStaff(data);
      } catch (err) {
        setError('Çalışanlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [isAdmin, navigate]);

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (!response.ok) throw new Error('Çalışan eklenemedi');
      setSuccess('Çalışan başarıyla eklendi!');
      setAddModal(false);
      setAddForm({
        name: '',
        hire_date: '',
        type: '',
        phone: '',
        email: '',
        address: '',
        salary: '',
        username: '',
        password: '',
        is_active: true
      });
      setLoading(true);
      const res = await fetch('http://localhost:3000/staff');
      setStaff(await res.json());
      setLoading(false);
    } catch (err) {
      setError('Çalışan eklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) return;
    try {
      const response = await fetch(`http://localhost:3000/staff/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Çalışan silinemedi');
      setSuccess('Çalışan başarıyla silindi!');
      setLoading(true);
      const res = await fetch('http://localhost:3000/staff');
      setStaff(await res.json());
      setLoading(false);
    } catch (err) {
      setError('Çalışan silinirken bir hata oluştu.');
    }
  };

  const openAddModal = () => {
    setAddForm({
      name: '',
      hire_date: '',
      type: '',
      phone: '',
      email: '',
      address: '',
      salary: '',
      username: '',
      password: '',
      is_active: true
    });
    setAddModal(true);
  };

  const handleEditClick = (person) => {
    setEditForm({
      name: person.name,
      hire_date: person.hire_date.slice(0, 10),
      type: person.type || '',
      phone: person.phone || '',
      email: person.email || '',
      address: person.address || '',
      salary: person.salary || '',
      username: person.username || '',
      password: person.password || '',
      is_active: person.is_active !== undefined ? person.is_active : true
    });
    setEditModal({ open: true, person });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.person) return;
    try {
      const response = await fetch(`http://localhost:3000/staff/${editModal.person.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Çalışan güncellenemedi');
      }
      
      setSuccess('Çalışan başarıyla güncellendi!');
      setEditModal({ open: false, person: null });
      setLoading(true);
      const res = await fetch('http://localhost:3000/staff');
      if (!res.ok) throw new Error('Çalışanlar yüklenemedi');
      setStaff(await res.json());
      setLoading(false);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Çalışan güncellenirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl text-indigo-600 font-medium">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200/50"
        >
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="text-2xl font-semibold">Hata</h2>
          </div>
          <p className="text-gray-600">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-all duration-200 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Geri
        </motion.button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Çalışanlar
            </h1>
            <p className="text-gray-600">Restoran çalışanlarını yönetin</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 font-medium transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Çalışan Ekle
          </motion.button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">İsim</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">İşe Başlama Tarihi</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Tip</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.map((person, index) => (
                  <motion.tr
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-6 text-sm text-gray-900">{person.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium">{person.name}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{formatDate(person.hire_date)}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        person.type === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        person.type === 'Mutfak' ? 'bg-orange-100 text-orange-800' :
                        person.type === 'Garson' ? 'bg-blue-100 text-blue-800' :
                        person.type === 'Kasiyer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {person.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditClick(person)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Düzenle
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(person.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Sil
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Çalışan Ekle Modalı */}
        <AnimatePresence>
          {addModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-200/50"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Yeni Çalışan Ekle</h2>
                    <p className="text-gray-600 mt-1">Yeni çalışan bilgilerini girin</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                      <input
                        type="text"
                        name="name"
                        value={addForm.name}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İşe Başlama Tarihi</label>
                      <input
                        type="date"
                        name="hire_date"
                        value={addForm.hire_date}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan Tipi</label>
                      <select
                        name="type"
                        value={addForm.type}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      >
                        <option value="">Seçiniz</option>
                        <option value="Admin">Admin</option>
                        <option value="Mutfak">Mutfak</option>
                        <option value="Garson">Garson</option>
                        <option value="Kasiyer">Kasiyer</option>
                        <option value="Yönetici">Yönetici</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                      <input
                        type="tel"
                        name="phone"
                        value={addForm.phone}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                      <input
                        type="email"
                        name="email"
                        value={addForm.email}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                      <textarea
                        name="address"
                        value={addForm.address}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maaş</label>
                      <input
                        type="number"
                        name="salary"
                        value={addForm.salary}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                      <input
                        type="text"
                        name="username"
                        value={addForm.username}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                      <input
                        type="password"
                        name="password"
                        value={addForm.password}
                        onChange={handleAddFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={addForm.is_active}
                          onChange={(e) => setAddForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Aktif</label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setAddModal(false)}
                      className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      İptal
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
                    >
                      Ekle
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Düzenle Modalı */}
        <AnimatePresence>
          {editModal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-200/50"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Çalışanı Düzenle</h2>
                    <p className="text-gray-600 mt-1">Çalışan bilgilerini güncelleyin</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditModal({ open: false, person: null })}
                    className="text-gray-400 hover:text-gray-600 transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İşe Başlama Tarihi</label>
                      <input
                        type="date"
                        name="hire_date"
                        value={editForm.hire_date}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan Tipi</label>
                      <select
                        name="type"
                        value={editForm.type}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        required
                      >
                        <option value="">Seçiniz</option>
                        <option value="Admin">Admin</option>
                        <option value="Mutfak">Mutfak</option>
                        <option value="Garson">Garson</option>
                        <option value="Kasiyer">Kasiyer</option>
                        <option value="Yönetici">Yönetici</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                      <textarea
                        name="address"
                        value={editForm.address}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maaş</label>
                      <input
                        type="number"
                        name="salary"
                        value={editForm.salary}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                      <input
                        type="password"
                        name="password"
                        value={editForm.password}
                        onChange={handleEditFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Aktif</label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setEditModal({ open: false, person: null })}
                      className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      İptal
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
                    >
                      Kaydet
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <StaffScheduleCalendar />
    </div>
  );
};

export default Staff; 