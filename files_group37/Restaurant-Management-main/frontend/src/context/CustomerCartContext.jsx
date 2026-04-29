import { createContext, useContext, useState } from 'react';

const CustomerCartContext = createContext();

export const useCustomerCart = () => useContext(CustomerCartContext);

export const CustomerCartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <CustomerCartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CustomerCartContext.Provider>
  );
}; 