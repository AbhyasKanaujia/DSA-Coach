import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children, showSidebar = true }) {
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  }, []);

  const handleMobileOpen = useCallback(() => setIsMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const primaryAction = {
    label: 'Start Session',
    to: '/review',
    icon: null,
  };

  const streakCount = user?.stats?.streak ?? 0;
  const lastActive = user?.stats?.lastActiveDate ? new Date(user.stats.lastActiveDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActiveDay = lastActive ? new Date(lastActive.setHours(0, 0, 0, 0)) : null;
  const streakActive =
    !!lastActiveDay &&
    (today - lastActiveDay) / (1000 * 60 * 60 * 24) <= 1;

  return (
    <div className="min-h-screen flex">
      {showSidebar && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isMobileOpen={isMobileOpen}
          onMobileClose={handleMobileClose}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          streak={{ count: streakCount, active: streakActive }}
          primaryAction={primaryAction}
          onMenuOpen={handleMobileOpen}
        />

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
