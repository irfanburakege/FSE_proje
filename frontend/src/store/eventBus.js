/**
 * Simple publish/subscribe event bus for cross-module communication.
 * Enables real-time updates across Patient, Doctor, and Reception views.
 */
class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try { cb(data); } catch (e) { console.error(`EventBus error on "${event}":`, e); }
    });
  }
}

export const eventBus = new EventBus();
