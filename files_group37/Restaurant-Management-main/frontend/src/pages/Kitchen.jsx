import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [success, setSuccess] = useState('');
  const [editModal, setEditModal] = useState({ open: false, order: null });
  const [editForm, setEditForm] = useState({ table_id: '', items: [] });
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [newItem, setNewItem] = useState({ menu_item_id: '', quantity: 1 });
  const [activeTab, setActiveTab] = useState('Hazırlanıyor'); // 'Hazırlanıyor', 'Hazır', 'İptal Edildi'
  const [searchTable, setSearchTable] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:3000';

  // Masaları getir
  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables`);
      setTables(response.data);
    } catch (err) {
      setError('Masalar yüklenirken bir hata oluştu.');
      console.error('Error fetching tables:', err);
    }
  };

  // Menü ürünlerini getir
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/menu_items`);
      setMenuItems(response.data);
    } catch (err) {
      setError('Menü ürünleri yüklenirken bir hata oluştu.');
      console.error('Error fetching menu items:', err);
    }
  };

  // Siparişleri çek
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError('Siparişler yüklenirken bir hata oluştu.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
    
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sipariş durumunu güncelle
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);

      // Status değerlerini doğrudan veritabanı değerleriyle gönder
      await axios.put(`${API_BASE_URL}/order/${orderId}/status`, { status: newStatus });
      setSuccess('Sipariş durumu güncellendi!');
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Durum güncellenirken bir hata oluştu.');
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      setSuccess('Sipariş başarıyla silindi!');
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Sipariş silinirken bir hata oluştu.');
      console.error('Error deleting order:', err);
    }
  };

  // Güncelle butonuna tıklandığında modalı aç
  const handleEditClick = (order) => {
    setEditForm({
      table_id: order.table_id,
      items: order.items.map(item => ({ ...item }))
    });
    setEditModal({ open: true, order });
  };

  // Modal form değişikliği
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ürün miktarını değiştir
  const handleItemQuantityChange = (idx, value) => {
    setEditForm(prev => {
      const items = [...prev.items];
      items[idx].quantity = Math.max(1, Number(value));
      return { ...prev, items };
    });
  };

  // Ürün çıkar
  const handleRemoveItem = (idx) => {
    setEditForm(prev => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items };
    });
  };

  // Yeni ürün ekle
  const handleAddNewItem = () => {
    if (!newItem.menu_item_id || newItem.quantity < 1) return;
    
    setEditForm(prev => {
      const existingIdx = prev.items.findIndex(i => i.menu_item_id === Number(newItem.menu_item_id));
      if (existingIdx !== -1) {
        const items = [...prev.items];
        items[existingIdx].quantity += Number(newItem.quantity);
        return { ...prev, items };
      }
      return {
        ...prev,
        items: [...prev.items, {
          menu_item_id: Number(newItem.menu_item_id),
          name: menuItems.find(m => m.id === Number(newItem.menu_item_id))?.name || '',
          quantity: Number(newItem.quantity)
        }]
      };
    });
    setNewItem({ menu_item_id: '', quantity: 1 });
  };

  // Modal form gönderimi
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.order) return;
    
    try {
      await axios.put(`${API_BASE_URL}/order/${editModal.order.id}`, {
        table_id: Number(editForm.table_id),
        items: editForm.items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity }))
      });
      setSuccess('Sipariş başarıyla güncellendi!');
      setEditModal({ open: false, order: null });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Sipariş güncellenirken bir hata oluştu.');
      console.error('Error updating order:', err);
    }
  };

  // Siparişleri filtrele
  const filteredOrders = orders
    .filter(order => {
      if (activeTab === 'Hazırlanıyor') return order.status === 'Hazırlanıyor';
      if (activeTab === 'Hazır') return order.status === 'Hazır' || order.status === 'Teslim Edildi';
      if (activeTab === 'İptal Edildi') return order.status === 'İptal Edildi';
      return true;
    })
    .filter(order =>
      searchTable === '' ||
      (order.table_name && order.table_name.toLowerCase().includes(searchTable.toLowerCase())) ||
      (order.table_id && order.table_id.toString().includes(searchTable))
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-center gap-3 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-xl text-gray-800 font-medium text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center mb-8">
          Mutfak Paneli
        </h1>

        {/* Sekmeler */}
        <div className="flex justify-center mb-8 space-x-4">
          {['Hazırlanıyor', 'Hazır', 'İptal Edildi'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-2.5 rounded-xl font-medium focus:outline-none transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-50 border border-gray-200/50'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Arama Kutusu */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              placeholder="Masa adı veya numarası ara..."
              value={searchTable}
              onChange={e => setSearchTable(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-200/50 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Geri Butonu */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 hover:bg-indigo-50 px-4 py-2 rounded-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Geri
        </motion.button>

        {/* Hata ve Başarı Mesajları */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sipariş Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 relative hover:shadow-2xl transition-all duration-200"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {order.table_name || order.table_id}
                </h3>
                <p className="text-sm text-gray-500">
                  Sipariş No: {order.id}
                </p>
                <p className="text-sm text-gray-500">
                  Tarih: {new Date(order.created_at).toLocaleString('tr-TR')}
                </p>
                {order.notes && order.notes.trim() !== '' && (
                  <div className="mt-2 p-2 bg-gray-50/50 backdrop-blur-sm rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Not: {order.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50/50 backdrop-blur-sm p-2 rounded-lg">
                    <span className="text-gray-700 font-medium">{item.name}</span>
                    <span className="text-indigo-600 font-semibold">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.status === 'Hazırlanıyor' && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange(order.id, 'Hazır')}
                    disabled={updatingOrderId === order.id}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg ${
                      updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {updatingOrderId === order.id ? 'Güncelleniyor...' : 'Hazır!'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange(order.id, 'İptal Edildi')}
                    disabled={updatingOrderId === order.id}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg ${
                      updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {updatingOrderId === order.id ? 'Güncelleniyor...' : 'İptal Et'}
                  </motion.button>
                </div>
              )}

              {(order.status === 'Hazır' || order.status === 'Teslim Edildi') && (
                <div className="text-center py-2.5 px-4 rounded-xl font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                  {order.status === 'Hazır' ? 'Sipariş Hazır' : 'Sipariş Teslim Edildi'}
                </div>
              )}

              {order.status === 'İptal Edildi' && (
                <div className="text-center py-2.5 px-4 rounded-xl font-medium bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200">
                  Sipariş İptal Edildi
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Güncelle Modalı */}
        <AnimatePresence>
          {editModal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200/50"
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                  Siparişi Düzenle
                </h2>

                <form onSubmit={handleEditSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Masa
                    </label>
                    <select
                      name="table_id"
                      value={editForm.table_id}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border border-gray-200/50 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                    >
                      <option value="">Masa seçin</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Sipariş Ürünleri
                    </h3>
                    {editForm.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 mb-3 bg-gray-50/50 backdrop-blur-sm p-3 rounded-lg">
                        <span className="flex-1 text-gray-700 font-medium">{item.name}</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemQuantityChange(idx, e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                      </div>
                    ))}

                    <div className="flex items-center gap-4 mt-4">
                      <select
                        value={newItem.menu_item_id}
                        onChange={e => setNewItem(prev => ({ ...prev, menu_item_id: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-gray-200/50 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="">Ürün seçin</option>
                        {menuItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-20 px-3 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleAddNewItem}
                        className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-md"
                      >
                        Ekle
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setEditModal({ open: false, order: null })}
                      className="px-6 py-2.5 border border-gray-200/50 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                      İptal
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-md"
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
    </div>
  );
}

export default Kitchen;
  