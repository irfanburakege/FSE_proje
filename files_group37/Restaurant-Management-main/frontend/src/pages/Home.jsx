import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import Menu from './Menu';
import Kitchen from './Kitchen';
import UpdateMenuItems from './UpdateMenuItems';
import Tables from './Tables';
import Staff from './Staff';
import Ingredients from './Ingredients';
import PastOrders from './PastOrders';
import Statistics from './Statistics';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/menu', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/menu', label: 'Kasa', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { path: '/kitchen', label: 'Mutfak Paneli', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/past-orders', label: 'Geçmiş Siparişler', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/ingredients', label: 'Malzemeler', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', adminOnly: true },
    { path: '/statistics', label: 'İstatistikler', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', adminOnly: true },
    { path: '/tables', label: 'Masaları Düzenle', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', adminOnly: true },
    { path: '/staff', label: 'Çalışanlar', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', adminOnly: true },
    { path: '/update_menu_items', label: 'Menüyü Güncelle', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', adminOnly: true },
  ];

  const handleMenuClick = (item) => {
    if (item.adminOnly && !isAdmin()) {
      alert('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <div className={`bg-white/80 backdrop-blur-lg shadow-xl transition-all duration-300 ease-in-out ${isMenuOpen ? 'w-72' : 'w-20'} flex flex-col border-r border-gray-200/50`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          {isMenuOpen && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              Restoran
            </h1>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <svg className={`h-5 w-5 ${isMenuOpen ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {isMenuOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200/50">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium border border-red-200/50 hover:border-red-300`}
          >
            <svg className={`h-5 w-5 ${isMenuOpen ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isMenuOpen && <span>Çıkış Yap</span>}
          </button>
        </div>
      </div>
        </div>


      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/update_menu_items" element={<UpdateMenuItems />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/past-orders" element={<PastOrders />} />
            <Route path="/ingredients" element={<Ingredients />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Home; 