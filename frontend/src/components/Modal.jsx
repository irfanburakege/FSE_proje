/**
 * Modal — Reusable modal dialog component.
 * Renders children inside an overlay with click-outside and Escape key to close.
 */
import React, { useEffect } from 'react';
import { useModal } from '../context/StoreContext.jsx';

export default function Modal() {
  const { modalContent, modalVisible, closeModal } = useModal();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modalVisible) closeModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalVisible, closeModal]);

  if (!modalContent && !modalVisible) return null;

  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  };

  return (
    <div
      id="modal-overlay"
      className={`modal-overlay ${modalVisible ? 'modal-visible' : ''} ${!modalContent ? 'hidden' : ''}`}
      onClick={handleOverlayClick}
    >
      <div id="modal-content" className="modal-content">
        {modalContent}
      </div>
    </div>
  );
}
