import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/parking', label: 'Parking Map' },
  { to: '/vehicles', label: 'My Vehicles' },
  { to: '/bookings', label: 'My Bookings' },
];

const adminLinks = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/slots', label: 'Manage Slots' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/analytics', label: 'Analytics' },
];

const AppLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="mark" />
          <span className="name">ParkPilot</span>
        </div>

        <nav className="sidebar-nav">
          {userLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label">ADMIN</div>
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="who">
              {user?.name}
              <span className="email">{user?.email}</span>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut} style={{ marginTop: 8, width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
