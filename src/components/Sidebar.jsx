import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Role-based navigation structure
const getNavigationItems = (userRole) => {
  const baseItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/incoming-files', label: 'Incoming', icon: '📥' },
    { to: '/received-files', label: 'Received', icon: '📦' },
    { to: '/sent-files', label: 'Sent', icon: '📤' },
    { to: '/create', label: 'Create File', icon: '➕' },
    { to: '/logs', label: 'Logs', icon: '📋' },
    { to: '/track', label: 'Track', icon: '🔍' },
  ];

  const adminItems = [
    { to: '/all-files', label: 'All Files', icon: '🗃️' },
    { to: '/department-files', label: 'Dept Files', icon: '🗂️' },
    { to: '/user-management', label: 'Users', icon: '👥' },
    { to: '/employee-directory', label: 'Directory', icon: '📒' },
    { to: '/email-test', label: 'Email Test', icon: '📧' },
  ];

  const userItems = [
    { to: '/my-files', label: 'My Files', icon: '📄' },
  ];

  const auditorItems = [
    { to: '/audit-log', label: 'Audit Log', icon: '📝' },
  ];

  const commonItems = [
    { to: '/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/my-profile', label: 'Profile', icon: '👤' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  let items = [...baseItems];

  // Add role-specific items
  if (userRole === 'superadmin' || userRole === 'admin') {
    items = [...items, ...adminItems];
  }
  
  if (userRole === 'user' || userRole === 'superadmin' || userRole === 'admin') {
    items = [...items, ...userItems];
  }
  
  if (userRole === 'auditor') {
    items = [...items, ...auditorItems];
  }

  // Add common items
  items = [...items, ...commonItems];

  return items;
};

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, loginAs, logout } = useAuth();
  
  const navigationItems = getNavigationItems(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* User Profile */}
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'User'}</div>
          </div>
        </div>
        
        {/* Role Switcher (Demo) */}
        {/* <div className="role-switcher">
          <select 
            className="form-select form-select-sm"
            value={user?.role}
            onChange={(e) => loginAs(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
            <option value="auditor">Auditor</option>
          </select>
        </div> */}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="btn btn-danger w-100" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 240px;
          height: 100vh;
          background: white;
          border-right: 1px solid var(--gray-200);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
        }

        .sidebar-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--gray-200);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .user-avatar {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border-radius: var(--radius-lg);
        }

        .user-name {
          font-weight: 600;
          color: var(--gray-900);
          font-size: var(--font-size-sm);
        }

        .user-role {
          color: var(--gray-500);
          font-size: var(--font-size-xs);
          text-transform: capitalize;
        }

        .role-switcher {
          margin-top: var(--space-2);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-2);
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          color: var(--gray-700);
          text-decoration: none;
          border-radius: var(--radius);
          margin-bottom: var(--space-1);
          transition: all 0.15s ease-in-out;
        }

        .nav-item:hover {
          background: var(--gray-50);
          color: var(--gray-900);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
        }

        .nav-icon {
          font-size: 1.25rem;
          width: 20px;
          text-align: center;
        }

        .nav-label {
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        .sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--gray-200);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
} 