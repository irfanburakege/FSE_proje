/**
 * Toast — Notification toast system rendered as a React component.
 * Replaces the DOM-based showToast utility from the prototype.
 */
import React from 'react';
import { useToast } from '../context/StoreContext.jsx';

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div id="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} ${toast.show ? 'toast-show' : ''}`}
          id={`toast-${toast.id}`}
        >
          <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
