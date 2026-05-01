/**
 * useStoreEvents — Custom hook that subscribes to EventBus events
 * and triggers component re-renders when relevant events fire.
 */
import { useEffect } from 'react';
import { useStore } from '../context/StoreContext.jsx';

/**
 * Subscribe to store events and re-render the component when they fire.
 * @param {string[]} events - Array of event names to listen to
 */
export function useStoreEvents(events = []) {
  const { eventBus, forceUpdate } = useStore();

  useEffect(() => {
    const allEvents = [...events, 'store:updated'];
    const unsubs = allEvents.map(event => eventBus.on(event, forceUpdate));
    return () => unsubs.forEach(unsub => unsub());
  }, [eventBus, forceUpdate, events.join(',')]);
}

// Default events that most views need
export const APPOINTMENT_EVENTS = [
  'appointment:created',
  'appointment:cancelled',
  'appointment:updated',
];

export const PATIENT_FLOW_EVENTS = [
  ...APPOINTMENT_EVENTS,
  'patient:checkedIn',
  'patient:statusChanged',
  'queue:updated',
];

export const ALL_EVENTS = [
  ...PATIENT_FLOW_EVENTS,
  'store:reset',
];
