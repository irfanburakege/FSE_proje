import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PastOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, menuRes] = await Promise.all([
          fetch('http://localhost:3000/orders'),
          fetch('http://localhost:3000/menu_items')
        ]);
        if (!ordersRes.ok || !menuRes.ok) throw new Error('Veriler yüklenemedi');
        const ordersData = await ordersRes.json();
        const menuData = await menuRes.json();
        setOrders(ordersData);
        setMenuItems(menuData);
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Menü ürünlerinden fiyat map'i oluştur
  const priceMap = {};
  menuItems.forEach(item => {
    priceMap[item.id] = item.price;
  });

  // Masalara göre grupla
  const tablesMap = {};
  orders.forEach(order => {
    if (!tablesMap[order.table_id]) {
      tablesMap[order.table_id] = {
        table_id: order.table_id,
        table_name: order.table_name,
        orders: []
      };
    }
    tablesMap[order.table_id].orders.push(order);
  });
  const tables = Object.values(tablesMap);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Geri
        </motion.button>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center mb-8"
        >
          Geçmiş Siparişler
        </motion.h1>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">
            Masalar
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-indigo-600 font-medium">Yükleniyor...</span>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-medium"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </motion.div>
          ) : tables.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 font-medium py-12"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Hiç sipariş yok.
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/50 backdrop-blur-sm hover:bg-white/80 cursor-pointer rounded-xl shadow-md border border-gray-200/50 p-6 flex flex-col items-center transition-all duration-200 hover:shadow-lg"
                  onClick={() => setSelectedTable(table)}
                >
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {table.table_name}
                  </h3>
                  <span className="text-gray-600">
                    {table.orders.length} sipariş
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Masa Detay Modalı */}
      <AnimatePresence>
        {selectedTable && (
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
              className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative border border-gray-200/50"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedTable(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                {selectedTable.table_name} - Geçmiş Siparişler
              </h2>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedTable.orders.map((order, index) => {
                  const orderTotal = order.items.reduce((sum, item) => 
                    sum + ((priceMap[item.menu_item_id] || 0) * item.quantity), 0
                  );
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="mb-3 flex justify-between items-center">
                        <span className="font-semibold text-gray-800">
                          Sipariş No: {order.id}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          {order.status}
                        </span>
                      </div>

                      <ul className="space-y-2 mb-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-800">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">x{item.quantity}</span>
                              <span className="text-gray-600">₺{Number(priceMap[item.menu_item_id] || 0).toFixed(2)}</span>
                              <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                ₺{Number((priceMap[item.menu_item_id] || 0) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="flex justify-between items-center text-sm">
                        <div className="text-gray-500">
                          {new Date(order.created_at).toLocaleString('tr-TR')}
                        </div>
                        <div className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Sipariş Toplamı: ₺{orderTotal.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PastOrders; 