/**
 * StoreContext — React Context + useReducer for global state management.
 * Wraps the Store class and provides reactive updates via EventBus.
 * Also provides Toast and Modal functionality via context.
 */
import React, { createContext, useContext, useReducer, useCallback, useRef, useState } from 'react';
import { store } from '../store/store.js';
import { eventBus } from '../store/eventBus.js';

/* ── Store Context ── */
const StoreContext = createContext(null);

// Simple reducer that increments a version counter to trigger re-renders
function storeReducer(state, action) {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, version: state.version + 1 };
    case 'RESET':
      return { ...state, version: state.version + 1 };
    default:
      return state;
  }
}

/* ── Toast Context ── */
const ToastContext = createContext(null);

/* ── Modal Context ── */
const ModalContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, { version: 0 });

  // Toast state
  const [toasts, setToasts] = useState([]);
  const toastCounter = useRef(0);

  // Modal state
  const [modalContent, setModalContent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Force update on any store event
  const forceUpdate = useCallback(() => {
    dispatch({ type: 'UPDATE' });
  }, []);

  // Toast helpers
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type, show: true }]);
    
    // Auto-show animation
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: true } : t));
    }, 10);
    
    // Auto-dismiss
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Modal helpers
  const showModal = useCallback((content) => {
    setModalContent(content);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setModalContent(null), 300);
  }, []);

  const storeValue = {
    store,
    eventBus,
    version: state.version,
    forceUpdate,
    showToast,
  };

  const toastValue = { toasts, removeToast };
  const modalValue = { modalContent, modalVisible, showModal, closeModal };

  return (
    <StoreContext.Provider value={storeValue}>
      <ToastContext.Provider value={toastValue}>
        <ModalContext.Provider value={modalValue}>
          {children}
        </ModalContext.Provider>
      </ToastContext.Provider>
    </StoreContext.Provider>
  );
}

/* ── Hooks ── */
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within StoreProvider');
  return context;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within StoreProvider');
  return context;
}
