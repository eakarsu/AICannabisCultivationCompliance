import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaSeedling, FaLeaf, FaBalanceScale, FaChartLine, FaFlask, FaSignOutAlt, FaCannabis, FaBoxes, FaTasks, FaCut, FaDna, FaRecycle, FaBell, FaIdCard, FaVial, FaTruck, FaBug, FaBolt, FaHistory, FaClipboardCheck } from 'react-icons/fa';

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Dashboard' },
    { to: '/grow-rooms', icon: <FaSeedling />, label: 'Grow Rooms' },
    { to: '/plants', icon: <FaLeaf />, label: 'Seed-to-Sale' },
    { to: '/compliance', icon: <FaBalanceScale />, label: 'Compliance' },
    { to: '/yield-predictions', icon: <FaChartLine />, label: 'Yield Predictions' },
    { to: '/lab-tests', icon: <FaFlask />, label: 'Lab Tests' },
    { to: '/inventory', icon: <FaBoxes />, label: 'Inventory' },
    { to: '/tasks', icon: <FaTasks />, label: 'Tasks' },
    { to: '/harvests', icon: <FaCut />, label: 'Harvests' },
    { to: '/strains', icon: <FaDna />, label: 'Strain Library' },
    { to: '/waste-records', icon: <FaRecycle />, label: 'Waste Tracking' },
    { to: '/environmental-alerts', icon: <FaBell />, label: 'Alerts' },
    { to: '/webhooks', icon: <FaBell />, label: 'Webhooks' },
    { to: '/operations', icon: <FaTruck />, label: 'Operations' },
    { to: '/custom-views', icon: <FaClipboardCheck />, label: 'Compliance Views' },
  ];

  const aiLinks = [
    { to: '/ai/regulatory-tracker', icon: <FaBalanceScale />, label: 'Regulatory Tracker' },
    { to: '/ai/harvest-timing', icon: <FaCut />, label: 'Harvest Timing' },
    { to: '/ai/license-renewal', icon: <FaIdCard />, label: 'License Renewal' },
    { to: '/ai/pest-detection', icon: <FaBug />, label: 'Pest Detection' },
    { to: '/ai/microbial-analyzer', icon: <FaVial />, label: 'Microbial Analyzer' },
    { to: '/ai/energy-optimizer', icon: <FaBolt />, label: 'Energy Optimizer' },
    { to: '/ai/seed-supplier', icon: <FaSeedling />, label: 'Supplier Audit' },
    { to: '/ai/supply-chain', icon: <FaTruck />, label: 'Supply Chain Audit' },
    { to: '/ai/harvest-readiness', icon: <FaClipboardCheck />, label: 'Harvest Readiness' },
    { to: '/ai/history', icon: <FaHistory />, label: 'AI History' },
  ];

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email
    ? user.email[0].toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <FaCannabis />
        </div>
        <div className="sidebar-title">
          CannaTech
          <span>Cultivation & Compliance</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 16, padding: '8px 12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>AI Tools</div>
        {aiLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email || 'User'}</div>
            <div className="sidebar-user-role">{user.role || 'Admin'}</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
