import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header({ user, streak, primaryAction, onMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const menuRef = useRef(null);
  const avatarButtonRef = useRef(null);

  const handleSignOut = useCallback(() => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: seg,
    to: '/' + segments.slice(0, i + 1).join('/'),
  }));

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !avatarButtonRef.current?.contains(e.target)) {
        closeMenu();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, closeMenu]);

  const showPrimaryCTA = primaryAction && location.pathname !== primaryAction.to;

  return (
    <header
      role="banner"
      className="py-3 bg-bg border-b border-border sticky top-0 z-30"
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={onMenuOpen}
              className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors duration-200"
              aria-label="Open navigation"
              aria-expanded="false"
              aria-controls="mobile-drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <nav aria-label="Breadcrumb" className="flex items-center font-mono text-sm min-w-0 overflow-hidden">
            <span className="text-accent flex-shrink-0">~/</span>
            {crumbs.length === 0 ? (
              <span className="text-text truncate" aria-current="page">dsa_coach</span>
            ) : (
              <Link to="/" className="text-textDim hover:text-text transition-colors truncate">
                dsa_coach
              </Link>
            )}
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.to} className="flex items-center min-w-0">
                  <span className="text-textDim flex-shrink-0">/</span>
                  {isLast ? (
                    <span className="text-text truncate" aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to} className="text-textDim hover:text-text transition-colors truncate">
                      {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isMobile && showPrimaryCTA && (
            <Link
              to={primaryAction.to}
              className="flex items-center gap-2 px-4 py-2 bg-bgLift hover:bg-bgCard border border-border rounded-lg transition-colors text-textDim hover:text-text font-medium"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4 text-accent" />}
              <span>{primaryAction.label}</span>
            </Link>
          )}

          {streak && (
            <Link
              to="/stats"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                streak.active ? 'text-accent' : 'text-textMuted'
              } hover:bg-bgLift`}
              aria-label={`Current streak: ${streak.count} days`}
            >
              <Flame className="w-4 h-4" />
              <span className="font-medium">{streak.count}</span>
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={toggleMenu}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-bgLift transition-colors duration-200"
                aria-label="User menu"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-bgCard border border-border flex items-center justify-center text-text font-medium">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                {!isMobile && user.name && (
                  <span className="font-medium text-text">{user.name}</span>
                )}
                {!isMobile && <ChevronDown className="w-4 h-4 text-textMuted" />}
              </button>

              {isMenuOpen && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-bgCard border border-border rounded-lg shadow-lg py-1 z-50"
                >
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-text">{user.name}</p>
                    <p className="text-xs text-textDim">{user.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-textDim hover:text-text hover:bg-bgLift transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-bgLift transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-textDim hover:text-text transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);