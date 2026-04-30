/**
 * Sidebar — Navigation sidebar with clinic branding, main nav links,
 * clock, and reset demo data button.
 */
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';

const NAV_ITEMS = [
  { section: 'Main Modules', items: [
    { path: '/patient',    icon: '📋', label: 'Patient Portal' },
    { path: '/doctor',     icon: '🩺', label: 'Doctor Dashboard' },
    { path: '/reception',  icon: '🖥️', label: 'Reception Desk' },
  ]},
  { section: 'Other Features', items: [
    { path: '/availability',  icon: '📅', label: 'Availability' },
    { path: '/reports',       icon: '📊', label: 'Reports' },
    { path: '/notifications', icon: '🔔', label: 'Notifications' },
    { path: '/audit',         icon: '📝', label: 'Audit Log' },
    { path: '/settings',      icon: '⚙️', label: 'Settings' },
  ]},
];

export default function Sidebar() {
  const { store, showToast, forceUpdate } = useStore();
  const [clock, setClock] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (window.confirm('Reset all demo data to defaults?')) {
      store.reset();
      showToast('Demo data has been reset.', 'success');
      forceUpdate();
    }
  };

  return (
    <aside id="sidebar" className={isCollapsed ? 'collapsed' : ''}>
      <div className="sidebar-brand">
        <div className="brand-icon-wrap" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }} title="Toggle Sidebar">
          <span className="brand-icon">🏥</span>
        </div>
        <div className="brand-text">
          <h1>Smart Clinic</h1>
          <span className="brand-sub">Patient Flow System</span>
        </div>
      </div>

      <nav id="main-nav">
        {NAV_ITEMS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="nav-divider" />}
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.path.replace('/', '')}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-clock" id="sidebar-clock">{clock}</div>
        <button id="reset-demo-btn" className="btn btn-reset" onClick={handleReset} title="Reset Demo Data">
          🔄 <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
}
