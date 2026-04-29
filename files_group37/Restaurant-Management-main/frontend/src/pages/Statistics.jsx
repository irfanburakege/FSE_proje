import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const Statistics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    financial: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      averageOrderValue: 0
    },
    orders: {
      totalOrders: 0,
      cancelledOrders: 0,
      completedOrders: 0,
      pendingOrders: 0
    },
    products: {
      totalProducts: 0,
      lowStockItems: 0,
      topSellingItems: []
    },
    timeBased: {
      dailyRevenue: [],
      weeklyRevenue: [],
      monthlyRevenue: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('daily');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('http://localhost:3000/statistics');
        if (!response.ok) throw new Error('İstatistikler yüklenemedi');
        const data = await response.json();
        
        // Backend'den gelen verileri frontend state yapısına dönüştür
        setStats({
          financial: {
            totalRevenue: data.financial?.total_revenue || 0,
            totalExpenses: 0, // Backend'de bu veri yok
            netProfit: data.financial?.total_revenue || 0, // Şimdilik toplam gelir olarak ayarlandı
            averageOrderValue: data.financial?.average_order_value || 0
          },
          orders: {
            totalOrders: data.orders?.total_orders || 0,
            cancelledOrders: data.orders?.canceled_orders || 0,
            completedOrders: data.orders?.completed_orders || 0,
            pendingOrders: data.orders?.pending_orders || 0
          },
          products: {
            totalProducts: data.products?.total_products || 0,
            lowStockItems: data.products?.unavailable_items || 0,
            topSellingItems: data.top_selling?.map(item => ({
              name: item.name,
              quantity: item.total_quantity
            })) || []
          },
          timeBased: {
            dailyRevenue: data.daily_revenue?.map(item => ({
              date: item.date,
              revenue: item.daily_revenue
            })) || [],
            weeklyRevenue: [], // Backend'de bu veri yok
            monthlyRevenue: [] // Backend'de bu veri yok
          }
        });
      } catch (err) {
        setError('İstatistikler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  const StatCard = ({ title, value, icon, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{value}</p>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </motion.div>
  );

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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            İstatistikler
          </h1>
          <p className="text-gray-600 text-lg">Restoran performans metrikleri ve analizler</p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex rounded-xl border border-gray-200/50 p-1 bg-white/80 backdrop-blur-lg">
            {['daily', 'weekly', 'monthly'].map((range) => (
              <motion.button
                key={range}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range === 'daily' ? 'Günlük' : range === 'weekly' ? 'Haftalık' : 'Aylık'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Toplam Gelir"
            value={`₺${stats.financial.totalRevenue.toLocaleString()}`}
            icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            trend={5.2}
            color="bg-green-100"
          />
          <StatCard
            title="Toplam Gider"
            value={`₺${stats.financial.totalExpenses.toLocaleString()}`}
            icon={<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            trend={-2.1}
            color="bg-red-100"
          />
          <StatCard
            title="Net Kar"
            value={`₺${stats.financial.netProfit.toLocaleString()}`}
            icon={<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            trend={8.3}
            color="bg-indigo-100"
          />
          <StatCard
            title="Ortalama Sipariş Değeri"
            value={`₺${Number(stats.financial.averageOrderValue).toFixed(2)}`}
            icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            trend={3.7}
            color="bg-purple-100"
          />
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Toplam Sipariş"
            value={stats.orders.totalOrders}
            icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            trend={12.5}
            color="bg-blue-100"
          />
          <StatCard
            title="İptal Edilen Siparişler"
            value={stats.orders.cancelledOrders}
            icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
            trend={-4.2}
            color="bg-orange-100"
          />
          <StatCard
            title="Tamamlanan Siparişler"
            value={stats.orders.completedOrders}
            icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            trend={15.8}
            color="bg-green-100"
          />
          <StatCard
            title="Bekleyen Siparişler"
            value={stats.orders.pendingOrders}
            icon={<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            trend={0}
            color="bg-yellow-100"
          />
        </div>

        {/* Product Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-8 border border-gray-200/50"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Ürün İstatistikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Stok Durumu</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200">
                  <span className="text-gray-600">Toplam Ürün Sayısı</span>
                  <span className="font-semibold text-gray-800">{stats.products.totalProducts}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200">
                  <span className="text-gray-600">Düşük Stoklu Ürünler</span>
                  <span className="font-semibold text-red-600">{stats.products.lowStockItems}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">En Çok Satan Ürünler</h3>
              <div className="space-y-4">
                {stats.products.topSellingItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-semibold text-gray-800">{item.quantity} adet</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-200/50"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Gelir Grafiği</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.timeBased.dailyRevenue}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  stroke="#6B7280"
                />
                <YAxis 
                  tickFormatter={(value) => `₺${value.toLocaleString()}`}
                  stroke="#6B7280"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`₺${value.toLocaleString()}`, 'Gelir']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Statistics; 