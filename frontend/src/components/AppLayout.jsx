import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AdminBadge } from './Badge';

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive ? 'bg-bg-hover text-text' : 'text-text-dim hover:text-text hover:bg-bg-lift'
  }`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full bg-bg text-text">
      <header className="border-b border-border bg-bg-lift">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <NavLink to="/" className="font-mono text-sm font-semibold text-accent">
            ~/dsa_coach
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/collections" className={navLinkClass}>
              Browse
            </NavLink>
            <NavLink to="/library" className={navLinkClass}>
              Library
            </NavLink>
            <NavLink to="/session" className={navLinkClass}>
              Session
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
            <span className="ml-3 flex items-center gap-2 text-xs text-text-faint">
              {user?.email}
              {user?.role === 'admin' && <AdminBadge />}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm text-text-dim hover:bg-bg-hover hover:text-text"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
