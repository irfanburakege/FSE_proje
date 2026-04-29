import { useEffect, useState } from 'react';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerOrder = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { cart, addToCart, removeFromCart, clearCart } = useCustomerCart();
  const [success, setSuccess] = useState('');
  const [table, setTable] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [activeCategory, setActiveCategory] = useState('Ana Yemek');
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { tableId } = useParams();
  const navigate = useNavigate();

  const categories = ['Ana Yemek', 'Başlangıç', 'Çorba', 'Salata', 'Tatlı', 'İçecek'];

  useEffect(() => {
    const fetchTableInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3000/tables/${tableId}`);
        if (!response.ok) throw new Error('Masa bilgisi alınamadı');
        const data = await response.json();
        setTable(data);
        localStorage.setItem('customerTable', JSON.stringify(data));
      } catch (err) {
        setError('Masa bilgisi alınırken bir hata oluştu.');
        setLoading(false);
      }
    };

    if (tableId) {
      fetchTableInfo();
    } else {
      setError('Geçersiz masa bilgisi.');
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('http://localhost:3000/menu_items');
        if (!response.ok) throw new Error('Menü yüklenemedi');
        const data = await response.json();
        // Sadece mevcut olan ürünleri filtrele
        const availableItems = data.filter(item => item.is_available);
        setMenu(availableItems);
      } catch (err) {
        setError('Menü yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const fetchTableOrders = async () => {
      if (!table?.id) return;
      try {
        const response = await fetch(`http://localhost:3000/orders/table/${table.id}`);
        if (!response.ok) throw new Error('Siparişler alınamadı');
        const data = await response.json();
        setTableOrders(data);
      } catch (err) {
        console.error('Siparişler alınırken hata:', err);
      }
    };

    fetchTableOrders();
  }, [table?.id]);

  const handleAddToCart = async (item) => {
    setIsAddingToCart(prev => ({ ...prev, [item.id]: true }));
    try {
      await addToCart(item);
      // Başarılı ekleme animasyonu için kısa bir gecikme
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      setError('Ürün sepetten çıkarılırken bir hata oluştu.');
    }
  };

  const handleConfirm = async () => {
    if (!table?.id) {
      setError('Masa bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    if (cart.length === 0) {
      setError('Sepetiniz boş.');
      return;
    }
    setError('');

    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const orderData = {
      table_id: table.id,
      order_items: cart.map(item => ({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price
      })),
      total_amount: totalAmount,
      status: 'Hazırlanıyor',
      payment_status: 'Ödenmedi',
      notes: orderNote.trim(),
      payment_method: 'Nakit'
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch('http://localhost:3000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          payment_method: "Nakit",
          payment_status:  "Ödenmedi"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sipariş oluşturulamadı');
      }

      setSuccess('Siparişiniz başarıyla alındı!');
      clearCart();
      localStorage.removeItem('pendingOrder');

      setTimeout(() => {
        navigate(`/table/${orderData.table_id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş menü öğeleri
  const filteredMenu = menu
    .filter(item => item.category === activeCategory)
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xl font-medium">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 text-center">Sipariş Ver</h1>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">{table?.name || 'Masa seçilmedi'} - {table?.type}</label>
              <span className="text-sm text-gray-500">Masa No: {table?.id}</span>
            </div>
          </div>

          <div className="mb-8 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Sepet</h2>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Sepeti temizlemek istediğinizden emin misiniz?')) {
                      clearCart();
                    }
                  }}
                  className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Sepeti Temizle
                </button>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">Sepetiniz boş</p>
              </div>
            ) : (
              <>
                <ul className="space-y-3 mb-6">
                  {cart.map(item => (
                    <li key={item.id} className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-all duration-200"
                            title="Miktarı Azalt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-gray-600">{item.quantity}</span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="p-1 text-gray-400 hover:text-indigo-500 rounded-lg transition-all duration-200"
                            title="Miktarı Artır"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-indigo-600 font-semibold">₺{Number(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => {
                            if (window.confirm('Bu ürünü sepetten çıkarmak istediğinizden emin misiniz?')) {
                              handleRemoveFromCart(item.id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Ürünü Kaldır"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sipariş Notu
                  </label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Siparişiniz için özel not ekleyebilirsiniz..."
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                    rows="3"
                  />
                </div>
                <div className="mb-4 text-right">
                  <span className="text-lg font-semibold">Toplam: </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ₺{cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Siparişi Onayla
                </button>
                {success && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl text-center font-medium">
                    {success}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arama ve Kategori sekmeleri */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full px-4 py-3 pl-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Seçili kategorideki ürünler */}
          {filteredMenu.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">Bu kategoride ürün bulunamadı</p>
            </div>
          ) : (
            filteredMenu.map(item => (
              <div key={item.id} className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-200">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover rounded-xl mb-4 shadow-sm" />
                )}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h2>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">₺{Number(item.price).toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isAddingToCart[item.id]}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-md transition-all duration-200 font-medium ${
                      isAddingToCart[item.id] ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isAddingToCart[item.id] ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    )}
                    Sepete Ekle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Mevcut Siparişler</h2>
          {tableOrders.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">Henüz sipariş bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const activeOrders = tableOrders.filter(order => order.status === 'Hazırlanıyor');
                
                if (activeOrders.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500">Hazırlanan sipariş bulunmuyor</p>
                    </div>
                  );
                }

                const allItems = activeOrders.flatMap(order => order.order_items);
                const combinedItems = allItems.reduce((acc, item) => {
                  const existingItem = acc.find(i => i.menu_item_name === item.menu_item_name);
                  if (existingItem) {
                    existingItem.quantity += item.quantity;
                    existingItem.total_price += item.unit_price * item.quantity;
                  } else {
                    acc.push({
                      menu_item_name: item.menu_item_name,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      total_price: item.unit_price * item.quantity
                    });
                  }
                  return acc;
                }, []);

                const totalAmount = combinedItems.reduce((total, item) => total + item.total_price, 0);
                const lastOrderDate = new Date(Math.max(...activeOrders.map(order => new Date(order.created_at))));

                return (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">Aktif Siparişler</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {activeOrders[0]?.status || 'Hazırlanıyor'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {combinedItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.menu_item_name} x {item.quantity}</span>
                          <span className="text-indigo-600">₺{Number(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200/50 flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {lastOrderDate.toLocaleString('tr-TR')}
                      </span>
                      <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Toplam: ₺{Number(totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrder; 